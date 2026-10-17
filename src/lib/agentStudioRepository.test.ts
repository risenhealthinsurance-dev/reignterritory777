import { beforeEach, expect, test } from "vitest";
import {
  createAgentStudioRepository,
  createLocalAgentStudioRepository,
  DEFAULT_AGENT_CONFIG,
  type AgentStudioRepository,
} from "./agentStudioRepository";

let repository: AgentStudioRepository;

beforeEach(() => {
  localStorage.clear();
  repository = createLocalAgentStudioRepository();
});

test("persists agent identity, knowledge sources, and approved actions locally", async () => {
  const initial = await repository.loadAgentConfig();
  expect(initial.name).toBe(DEFAULT_AGENT_CONFIG.name);

  const saved = await repository.saveAgentConfig({
    ...initial,
    name: "Territory Copilot",
    instructions: "Help reps prepare for the next business.",
  });
  const source = await repository.addKnowledgeSource({
    kind: "text",
    name: "Sales playbook",
    content: "Lead with operational savings.",
  });
  await repository.setAgentActionEnabled("schedule_follow_up", false);

  expect(saved.name).toBe("Territory Copilot");
  expect(source.status).toBe("ready");
  expect((await repository.loadAgentConfig()).knowledgeSources).toHaveLength(1);
  expect((await repository.loadAgentConfig()).actions.find((action) => action.type === "schedule_follow_up")?.enabled).toBe(false);
});

test("rejects unsupported knowledge file types", async () => {
  await expect(
    repository.addKnowledgeSource({ kind: "file", name: "brief.pdf", fileName: "brief.pdf", content: "" }),
  ).rejects.toThrow(/unsupported/i);
});

test("returns seeded pipeline opportunities and updates their stage locally", async () => {
  const opportunities = await repository.listPipelineOpportunities();
  expect(opportunities.length).toBeGreaterThan(0);
  expect(opportunities[0].stage).toBeDefined();

  const updated = await repository.updatePipelineStage(opportunities[0].id, "proposal");
  expect(updated.stage).toBe("proposal");
  expect((await repository.listPipelineOpportunities()).find((item) => item.id === updated.id)?.stage).toBe("proposal");
});

test("uses the Supabase repository boundary when a client is available", async () => {
  const calls: { table: string; operation: string }[] = [];
  const client = {
    from(table: string) {
      const query = {
        select: () => { calls.push({ table, operation: "select" }); return query; },
        limit: async () => ({ data: [], error: null }),
        upsert: async () => { calls.push({ table, operation: "upsert" }); return { error: null }; },
        insert: async () => { calls.push({ table, operation: "insert" }); return { error: null }; },
        eq: () => query,
        delete: () => query,
      };
      return query;
    },
  };
  const remote = createAgentStudioRepository(client);
  await remote.saveAgentConfig(await remote.loadAgentConfig());
  expect(calls.some((call) => call.table === "agent_configs" && call.operation === "upsert")).toBe(true);
});
