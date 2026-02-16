import "./lib/env.js";
import express from "express";
import cors from "cors";
import identifyRouter from "./routes/identify.js";
import itemsRouter from "./routes/items.js";
import { initDb } from "./lib/init-db.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    })
);

app.use(express.json({ limit: "10mb" }));

app.use("/api/identify-food", identifyRouter);
app.use("/api/items", itemsRouter);

async function start() {
    await initDb();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
