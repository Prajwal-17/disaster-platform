import { sql } from "drizzle-orm";
import type { DB } from "../../db";
import { userLocations } from "../../db/schema";

const upsertUserLocation = async (db: DB, userId: string, lat: number, lng: number) => {
  const [location] = await db
    .insert(userLocations)
    .values({
      userId,
      lat,
      lng,
    })
    .onConflictDoUpdate({
      target: userLocations.userId,
      set: {
        lat,
        lng,
        updatedAt: new Date(),
      },
    })
    .returning();
  return location;
};

const getRecentLocations = async (db: DB, minutesAgo: number = 5) => {
  const timeLimit = new Date(Date.now() - minutesAgo * 60 * 1000);
  return db
    .select()
    .from(userLocations)
    .where(sql`${userLocations.updatedAt} > ${timeLimit}`);
};

export const locationRepository = {
  upsertUserLocation,
  getRecentLocations,
};
