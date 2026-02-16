import dotenv from "dotenv";
import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

// Resolve .env paths relative to project root (server/), not process.cwd()
// This ensures env loading works regardless of how pm2 starts the process
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "../..");

const envPath = resolve(rootDir, ".env");
const envLocalPath = resolve(rootDir, ".env.local");

dotenv.config({ path: envPath });
if (existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath, override: true });
}
