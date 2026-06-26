export function formatMessageTime(timestamp: string) {
  const messageDate = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - messageDate.getTime()) / (60 * 1000),
  );
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays === 0) {
    if (diffInMinutes < 60) {
      return diffInMinutes <= 0 ? "acum" : `${diffInMinutes} min`;
    }
    return messageDate.toLocaleTimeString("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (diffInDays < 7) {
    return messageDate.toLocaleDateString("ro-RO", { weekday: "long" });
  }

  if (messageDate.getFullYear() === now.getFullYear()) {
    return messageDate.toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "short",
    });
  }

  return messageDate.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
