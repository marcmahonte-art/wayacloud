const relativeTimeFormatter = new Intl.RelativeTimeFormat("fr-FR", {
  numeric: "auto",
});

export function formatAmountFcfa(amount: number): string {
  if (typeof amount !== "number" || isNaN(amount)) return "0 F"
  return `${amount.toLocaleString("fr-FR")} F`;
}

export function formatStorageGo(value: number): string {
  if (typeof value !== "number" || isNaN(value)) return "0 Go"
  return `${value.toLocaleString("fr-FR")} Go`;
}

export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(diffMinutes, "minute");
  }

  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(diffHours, "hour");
  }

  if (diffDays === 0) {
    return "Aujourd'hui";
  }

  if (diffDays === -1) {
    return "Hier";
  }

  return relativeTimeFormatter.format(diffDays, "day");
}
