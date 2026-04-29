import type { DB } from "../../db";
import { locationRepository } from "./location.repository";

const upsertLocation = async (db: DB, userId: string, lat: number, lng: number) => {
  return locationRepository.upsertUserLocation(db, userId, lat, lng);
};

const getNearbyActiveLocations = async (
  db: DB,
  lat: number,
  lng: number,
  radiusKm: number = 10
) => {
  const recentLocations = await locationRepository.getRecentLocations(db, 5); // 5 mins

  const nearby = recentLocations
    .filter((loc) => {
      const dist = haversineKm(lat, lng, loc.lat, loc.lng);
      return dist <= radiusKm;
    })
    .map((loc) => ({
      ...loc,
      distanceKm: +haversineKm(lat, lng, loc.lat, loc.lng).toFixed(2),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return { locations: nearby, total: nearby.length };
};

// ─── Haversine ────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export const locationService = {
  upsertLocation,
  getNearbyActiveLocations,
};
