import { FunctionError } from "./errors.ts";

export interface Actor {
  userId: string;
  organizationId: string;
  repId: string;
}

export interface ActorLookup {
  getUser(token: string): Promise<{ id: string } | null>;
  findMembership(userId: string): Promise<{ organizationId: string } | null>;
  findRep(organizationId: string, userId: string): Promise<{ id: string } | null>;
}

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1])
    throw new FunctionError(401, "unauthorized", "A valid bearer token is required.");
  return match[1];
}

export async function requireActor(request: Request, client: ActorLookup): Promise<Actor> {
  const token = bearerToken(request);
  const user = await client.getUser(token);
  if (!user) throw new FunctionError(401, "unauthorized", "The session is invalid or expired.");
  const membership = await client.findMembership(user.id);
  if (!membership) {
    throw new FunctionError(403, "membership_required", "No organization membership is assigned.");
  }
  const rep = await client.findRep(membership.organizationId, user.id);
  if (!rep)
    throw new FunctionError(403, "rep_profile_required", "No representative profile is assigned.");
  return { userId: user.id, organizationId: membership.organizationId, repId: rep.id };
}

export function createSupabaseActorLookup(client: any): ActorLookup {
  return {
    async getUser(token) {
      const { data, error } = await client.auth.getUser(token);
      if (error) return null;
      return data.user ? { id: data.user.id } : null;
    },
    async findMembership(userId) {
      const { data, error } = await client
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      if (error)
        throw new FunctionError(500, "membership_lookup_failed", "Membership lookup failed.");
      return data ? { organizationId: data.organization_id } : null;
    },
    async findRep(organizationId, userId) {
      const { data, error } = await client
        .from("rep_profiles")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw new FunctionError(500, "rep_lookup_failed", "Representative lookup failed.");
      return data ? { id: data.id } : null;
    },
  };
}
