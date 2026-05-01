export const LOGIN_USER = "estoque.l41";
export const LOGIN_PASSWORD = "lojadigaspi";
export const AUTH_KEY = "digaspi-stock-auth";
export const RECEIPTS_KEY = "digaspi-stock-receipts";
export const PULLS_KEY = "digaspi-stock-pulls";
export const TTL_MS = 72 * 60 * 60 * 1000;

export const BRANDS = ["Nike", "Adidas", "Moleca", "Beira Rio", "Outras"] as const;

export type Brand = (typeof BRANDS)[number];
