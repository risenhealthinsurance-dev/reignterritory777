import { beforeEach, expect, test, vi } from "vitest";
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

test("lists local businesses with stable account-shaped records", async () => {
  const businesses = await repository.listBusinesses();

  expect(businesses).toHaveLength(6);
  expect(businesses[0]).toMatchObject({ id: "meridian", name: "Meridian Medical Devices" });
});

test("maps live businesses and coordinates from the Supabase repository", async () => {
  const liveBusiness = {
    id: "aaaaaaaa-0000-0000-0000-000000000099",
    display_name: "Live Territory Business",
    status: "active",
    business_locations: [
      {
        formatted_address: "1 Live Way, Fort Pierce, FL 34950",
        location: { type: "Point", coordinates: [-80.31, 27.44] },
      },
    ],
  };
  const client = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(async () => ({ data: [liveBusiness], error: null })),
      })),
    })),
  };

  const businesses = await createAgentStudioRepository(client).listBusinesses();

  expect(businesses).toHaveLength(1);
  expect(businesses[0]).toMatchObject({
    id: liveBusiness.id,
    name: "Live Territory Business",
    address: "1 Live Way, Fort Pierce, FL 34950",
    lat: 27.44,
    lng: -80.31,
  });
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
