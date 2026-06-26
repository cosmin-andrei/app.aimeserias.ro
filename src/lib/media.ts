import { getAvatarDisplayUrl, type VisibilityValue } from "@/lib/auth-client";

export const DEFAULT_USER_AVATAR = "/panda.png";

export function hasMediaImage(url?: string | null): boolean {
  return Boolean(url?.trim());
}

export function getUserAvatar(url?: string | null): string {
  return hasMediaImage(url) ? url!.trim() : DEFAULT_USER_AVATAR;
}

export function resolveProfileAvatarUrl(
  user: {
    id: string;
    avatar?: string | null;
    avatar_path?: string | null;
    avatar_visibility?: VisibilityValue | null;
  } | null | undefined
): string {
  if (!user) return DEFAULT_USER_AVATAR;

  if (user.avatar?.startsWith("http") || user.avatar?.startsWith("/static")) {
    return getUserAvatar(user.avatar);
  }

  const proxyUrl = getAvatarDisplayUrl(user, user.id);
  if (proxyUrl) return proxyUrl;

  return DEFAULT_USER_AVATAR;
}
