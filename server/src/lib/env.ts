import dotenv from "dotenv";
import { existsSync } from "fs";

dotenv.config();
if (existsSync(".env.local")) {
    dotenv.config({ path: ".env.local", override: true });
}
