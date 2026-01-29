export type PushNotificationData = {
  tripId?: string | number;
  notificationId?: string | number;
  type?: string;
};

export function coerceTripId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const maybe = (data as PushNotificationData).tripId;
  if (typeof maybe === "string" && maybe.trim().length > 0) return maybe;
  if (typeof maybe === "number" && Number.isFinite(maybe)) return String(maybe);
  return null;
}

