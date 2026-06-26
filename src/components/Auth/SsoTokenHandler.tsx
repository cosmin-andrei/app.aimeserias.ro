"use client";

import { useSsoToken } from "@/hooks/useSsoToken";

/**
 * Componentă client care procesează ssoToken din URL după redirect de la SSO.
 * Se renderează în layout-ul principal; nu afișează nimic vizual.
 */
export function SsoTokenHandler() {
  useSsoToken();
  return null;
}
