const READ_TOOLS = ["get_current_route", "get_current_stop", "get_account_brief", "search_osint_accounts", "refresh_account_intelligence", "build_route_preview", "get_field_day_summary"] as const;
const WRITE_TOOLS = ["save_visit_note", "record_disposition", "schedule_follow_up", "create_recovery_action", "update_route", "queue_offline_action"] as const;
export const ALLOWED_TOOLS = [...READ_TOOLS, ...WRITE_TOOLS] as const;
export function isAllowedTool(name: string): boolean { return (ALLOWED_TOOLS as readonly string[]).includes(name); }
export function validateToolCall(name: string, confirmed: boolean): { ok: boolean; error?: string } { if (!isAllowedTool(name)) return { ok: false, error: "Unknown tool" }; if ((WRITE_TOOLS as readonly string[]).includes(name) && !confirmed) return { ok: false, error: "Write action requires confirmation" }; return { ok: true }; }
