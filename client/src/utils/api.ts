// In dev: empty string (Vite proxy handles /api → localhost:3001)
// In prod: set VITE_API_URL=https://api.3lin.no
export const API_BASE = import.meta.env.VITE_API_URL ?? "";
