import "dotenv/config";
import express from "express";
import cors from "cors";
import identifyRouter from "./routes/identify.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
    cors({
        origin: "http://localhost:5173",
    })
);

app.use(express.json({ limit: "10mb" }));

app.use("/api/identify-food", identifyRouter);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
