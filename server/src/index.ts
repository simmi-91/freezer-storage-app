import "./lib/env.js";
import express from "express";
import cors from "cors";
import identifyRouter from "./routes/identify.js";
import itemsRouter from "./routes/items.js";

const app = express();
const PORT = process.env.EXPRESS_PORT || 3001;

const corsOrigin = process.env.FRONTEND_ORIGINS
    ? process.env.FRONTEND_ORIGINS.split(",").map((s) => s.trim())
    : ["http://localhost:5173", "http://localhost:5174"];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (server-to-server, curl, etc.)
            if (!origin) return callback(null, true);
            if (corsOrigin.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        allowedHeaders: ["Content-Type", "Authorization", "X-Custom-Header"],
        credentials: true,
    })
);

app.use(express.json({ limit: "10mb" }));

app.use("/api/identify-food", identifyRouter);
app.use("/api/items", itemsRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
