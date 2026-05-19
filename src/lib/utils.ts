const PICKUP_DAYS = [2, 5];
const CUTOFF_HOUR = 12;

export interface PickupInfo {
  isToday: boolean;
  nextDate: Date;
}

export function getPickupInfo(): PickupInfo {
  const now = new Date();
  const today = now.getDay();
  const isPickupToday = PICKUP_DAYS.includes(today);
  const beforeCutoff = now.getHours() < CUTOFF_HOUR;
  const isNowPickupTime = isPickupToday && beforeCutoff;

  let nextDate: Date | null = null;
  for (let i = 0; i < 7; i++) {
    const check = new Date(now);
    check.setDate(now.getDate() + i);
    check.setHours(0, 0, 0, 0);
    if (PICKUP_DAYS.includes(check.getDay())) {
      if (i === 0 && !beforeCutoff) continue;
      nextDate = check;
      break;
    }
  }

  return {
    isToday: isNowPickupTime,
    nextDate: nextDate ?? new Date(),
  };
}

export function isPickupDay(): boolean {
  const now = new Date();
  return PICKUP_DAYS.includes(now.getDay()) && now.getHours() < CUTOFF_HOUR;
}

export function getNextPickupDate(): Date {
  return getPickupInfo().nextDate;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function generateQRId(length = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
