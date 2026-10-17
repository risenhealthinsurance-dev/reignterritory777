import type { GeoJsonFeature, GeoJsonFeatureCollection } from "./gis";

export type TerritoryPlanPayload = {
  plan: { size: number; locked: boolean; quadrantsSaved: boolean; completedQuadrants: number[]; boundary: GeoJsonFeature; quadrants: GeoJsonFeatureCollection } | null;
  savedTerritories: Array<Array<{ lat: number; lng: number }>>;
};

type Client = { from(table: string): any };

export function createTerritoryRepository(client: Client | null) {
  return {
    async load(): Promise<TerritoryPlanPayload | null> {
      if (!client) return null;
      const { data, error } = await client.from("territory_plans").select("payload").eq("plan_key", "active").maybeSingle();
      if (error) throw error;
      return (data?.payload as TerritoryPlanPayload | undefined) ?? null;
    },
    async save(payload: TerritoryPlanPayload): Promise<void> {
      if (!client) return;
      const { error } = await client.from("territory_plans").upsert({ plan_key: "active", payload, updated_at: new Date().toISOString() }, { onConflict: "organization_id,plan_key" });
      if (error) throw error;
    },
  };
}
