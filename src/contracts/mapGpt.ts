import type { Account } from "../data/accounts";

export type PipelineStage = "new" | "qualified" | "discovery" | "proposal" | "negotiation" | "won" | "lost";

export type AgentKnowledgeSourceKind = "url" | "text" | "file";
export type AgentKnowledgeSourceStatus = "ready" | "pending" | "failed";

export interface AgentKnowledgeSource {
  id: string;
  kind: AgentKnowledgeSourceKind;
  name: string;
  url?: string;
  fileName?: string;
  content?: string;
  status: AgentKnowledgeSourceStatus;
  createdAt: string;
  updatedAt: string;
}

export type SafeAgentActionType =
  | "research"
  | "brief"
  | "save_visit_note"
  | "record_disposition"
  | "schedule_follow_up"
  | "suggest_route"
  | "update_pipeline";

export interface AgentActionBinding {
  type: SafeAgentActionType;
  label: string;
  description: string;
  enabled: boolean;
  requiresApproval: boolean;
}

export interface AgentConfig {
  id: string;
  name: string;
  assistantLabel: string;
  instructions: string;
  avatar: "orb" | "guide" | "scout";
  knowledgeSources: AgentKnowledgeSource[];
  actions: AgentActionBinding[];
  updatedAt: string;
}

export interface PipelineOpportunity {
  id: string;
  account: Account;
  stage: PipelineStage;
  estimatedValue: number;
  nextAction: string;
  commitment?: string;
}

export const PIPELINE_STAGES: { id: PipelineStage; label: string }[] = [
  { id: "new", label: "New" },
  { id: "qualified", label: "Qualified" },
  { id: "discovery", label: "Discovery" },
  { id: "proposal", label: "Proposal" },
  { id: "negotiation", label: "Negotiation" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
];

export const DEFAULT_AGENT_ACTIONS: AgentActionBinding[] = [
  { type: "research", label: "Research business", description: "Find current business and territory evidence.", enabled: true, requiresApproval: false },
  { type: "brief", label: "Generate brief", description: "Prepare a source-aware pre-call brief.", enabled: true, requiresApproval: false },
  { type: "save_visit_note", label: "Save visit note", description: "Draft and save a structured field note.", enabled: true, requiresApproval: true },
  { type: "record_disposition", label: "Record disposition", description: "Capture the outcome of a conversation or visit.", enabled: true, requiresApproval: true },
  { type: "schedule_follow_up", label: "Schedule callback or appointment", description: "Create a callback window or hard appointment draft.", enabled: true, requiresApproval: true },
  { type: "suggest_route", label: "Suggest route", description: "Recommend the next best sequence of stops.", enabled: true, requiresApproval: true },
  { type: "update_pipeline", label: "Update pipeline", description: "Move a business to a new pipeline stage.", enabled: true, requiresApproval: true },
];

