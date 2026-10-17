import { accounts } from "../data/accounts";
import type {
  AgentActionBinding,
  AgentConfig,
  AgentKnowledgeSource,
  PipelineOpportunity,
  PipelineStage,
  SafeAgentActionType,
} from "../contracts/mapGpt";
import { DEFAULT_AGENT_ACTIONS } from "../contracts/mapGpt";

const CONFIG_KEY = "reign-territory:mapgpt:agent-config:v1";
const PIPELINE_KEY = "reign-territory:mapgpt:pipeline:v1";

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  id: "reign-territory-agent",
  name: "Territory Copilot",
  assistantLabel: "Ask Reign",
  instructions: "Help B2B field reps understand the next business, prepare a useful conversation, and keep every action grounded in approved field data.",
  avatar: "orb",
  knowledgeSources: [],
  actions: DEFAULT_AGENT_ACTIONS,
  updatedAt: new Date(0).toISOString(),
};

export interface AgentStudioRepository {
  loadAgentConfig(): Promise<AgentConfig>;
  saveAgentConfig(config: AgentConfig): Promise<AgentConfig>;
  addKnowledgeSource(input: { kind: AgentKnowledgeSource["kind"]; name: string; url?: string; content?: string; fileName?: string }): Promise<AgentKnowledgeSource>;
  removeKnowledgeSource(id: string): Promise<void>;
  setAgentActionEnabled(type: SafeAgentActionType, enabled: boolean): Promise<AgentConfig>;
  listPipelineOpportunities(): Promise<PipelineOpportunity[]>;
  updatePipelineStage(id: string, stage: PipelineStage): Promise<PipelineOpportunity>;
}

export interface SupabaseAgentClient {
  from(table: string): any;
}

function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function seededPipeline(): PipelineOpportunity[] {
  return accounts.map((account, index) => ({
    id: account.id,
    account,
    stage: account.done ? (index === 0 ? "proposal" : "won") : index === 2 ? "discovery" : index === 3 ? "qualified" : "new",
    estimatedValue: account.revenue,
    nextAction: account.done ? "Confirm expansion path" : index === 2 ? "Prepare plant walkthrough brief" : "Research decision-maker timing",
    commitment: index === 2 ? "Board review pending" : undefined,
  }));
}

export function createLocalAgentStudioRepository(): AgentStudioRepository {
  const load = () => read<AgentConfig>(CONFIG_KEY, { ...DEFAULT_AGENT_CONFIG, actions: DEFAULT_AGENT_ACTIONS.map((action) => ({ ...action })) });
  const save = (config: AgentConfig) => {
    const next = { ...config, updatedAt: new Date().toISOString() };
    write(CONFIG_KEY, next);
    return next;
  };
  return {
    async loadAgentConfig() { return load(); },
    async saveAgentConfig(config) { return save(config); },
    async addKnowledgeSource(input) {
      if (input.kind === "file" && !/\.(txt|md|csv|json)$/i.test(input.fileName ?? input.name)) throw new Error("Unsupported knowledge file type");
      const now = new Date().toISOString();
      const source: AgentKnowledgeSource = { id: `source-${Date.now()}`, ...input, status: "ready", createdAt: now, updatedAt: now };
      save({ ...load(), knowledgeSources: [...load().knowledgeSources, source] });
      return source;
    },
    async removeKnowledgeSource(id) { save({ ...load(), knowledgeSources: load().knowledgeSources.filter((source) => source.id !== id) }); },
    async setAgentActionEnabled(type, enabled) {
      return save({ ...load(), actions: load().actions.map((action) => action.type === type ? { ...action, enabled } : action) });
    },
    async listPipelineOpportunities() { return read(PIPELINE_KEY, seededPipeline()); },
    async updatePipelineStage(id, stage) {
      const opportunities = read(PIPELINE_KEY, seededPipeline());
      const next = opportunities.map((opportunity) => opportunity.id === id ? { ...opportunity, stage } : opportunity);
      write(PIPELINE_KEY, next);
      const updated = next.find((opportunity) => opportunity.id === id);
      if (!updated) throw new Error("Pipeline opportunity not found");
      return updated;
    },
  };
}

export function createAgentStudioRepository(client: SupabaseAgentClient | null): AgentStudioRepository {
  const local = createLocalAgentStudioRepository();
  if (!client) return local;
  const remoteClient = client;
  let activeAgentId: string | null = null;
  async function remoteOr<T>(remote: () => Promise<T>, fallback: () => Promise<T>) {
    try { return await remote(); } catch { return fallback(); }
  }
  async function ensureAgent() {
    if (activeAgentId) return activeAgentId;
    const { data, error } = await remoteClient.from("agent_configs").select("id").limit(1);
    if (error) throw error;
    activeAgentId = data?.[0]?.id ?? null;
    return activeAgentId;
  }
  return {
    async loadAgentConfig() {
      return remoteOr(async () => {
        const { data, error } = await remoteClient.from("agent_configs").select("*").limit(1);
        if (error) throw error;
        if (!data?.[0]) return local.loadAgentConfig();
        activeAgentId = data[0].id;
        const [sourcesResult, actionsResult] = await Promise.all([
          remoteClient.from("agent_knowledge_sources").select("*").eq("agent_id", activeAgentId),
          remoteClient.from("agent_action_bindings").select("*").eq("agent_id", activeAgentId),
        ]);
        if (sourcesResult.error || actionsResult.error) throw sourcesResult.error ?? actionsResult.error;
        const fallback = await local.loadAgentConfig();
        const sourceRows = sourcesResult.data ?? [];
        const actionRows = actionsResult.data ?? [];
        return {
          id: data[0].id,
          name: data[0].name,
          assistantLabel: data[0].assistant_label,
          instructions: data[0].instructions,
          avatar: data[0].avatar,
          knowledgeSources: sourceRows.map((source: any) => ({ id: source.id, kind: source.kind, name: source.name, url: source.url, fileName: source.file_name, content: source.content, status: source.status, createdAt: source.created_at, updatedAt: source.updated_at })),
          actions: fallback.actions.map((action) => ({ ...action, enabled: actionRows.find((row: any) => row.action_type === action.type)?.enabled ?? action.enabled })),
          updatedAt: data[0].updated_at,
        } as AgentConfig;
      }, () => local.loadAgentConfig());
    },
    async saveAgentConfig(config) {
      return remoteOr(async () => {
        const id = (await ensureAgent()) ?? config.id;
        const row = { id, name: config.name, assistant_label: config.assistantLabel, instructions: config.instructions, avatar: config.avatar };
        const { error } = await remoteClient.from("agent_configs").upsert(row);
        if (error) throw error;
        activeAgentId = id;
        return local.saveAgentConfig(config);
      }, () => local.saveAgentConfig(config));
    },
    async addKnowledgeSource(input) {
      return remoteOr(async () => {
        const agentId = (await ensureAgent()) ?? (await local.loadAgentConfig()).id;
        const source = await local.addKnowledgeSource(input);
        const { error } = await remoteClient.from("agent_knowledge_sources").insert({ id: source.id, agent_id: agentId, kind: source.kind, name: source.name, url: source.url, file_name: source.fileName, content: source.content, status: source.status });
        if (error) throw error;
        return source;
      }, () => local.addKnowledgeSource(input));
    },
    async removeKnowledgeSource(id) {
      await remoteOr(async () => { const { error } = await remoteClient.from("agent_knowledge_sources").delete().eq("id", id); if (error) throw error; }, async () => undefined);
      return local.removeKnowledgeSource(id);
    },
    async setAgentActionEnabled(type, enabled) {
      return remoteOr(async () => {
        const agentId = (await ensureAgent()) ?? (await local.loadAgentConfig()).id;
        const { error } = await remoteClient.from("agent_action_bindings").upsert({ agent_id: agentId, action_type: type, enabled });
        if (error) throw error;
        return local.setAgentActionEnabled(type, enabled);
      }, () => local.setAgentActionEnabled(type, enabled));
    },
    async listPipelineOpportunities() {
      return remoteOr(async () => {
        const { data, error } = await remoteClient.from("business_pipeline").select("business_id,stage,estimated_value,next_action,commitment,businesses(*)");
        if (error) throw error;
        if (!data?.length) return local.listPipelineOpportunities();
        const fallback = await local.listPipelineOpportunities();
        return data.map((row: any) => ({ ...fallback.find((item) => item.id === row.business_id), id: row.business_id, stage: row.stage, estimatedValue: row.estimated_value, nextAction: row.next_action, commitment: row.commitment }));
      }, () => local.listPipelineOpportunities());
    },
    async updatePipelineStage(id, stage) {
      return remoteOr(async () => {
        const { error } = await remoteClient.from("business_pipeline").upsert({ business_id: id, stage });
        if (error) throw error;
        return local.updatePipelineStage(id, stage);
      }, () => local.updatePipelineStage(id, stage));
    },
  };
}

