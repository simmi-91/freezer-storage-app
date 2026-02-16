import { Router, Request, Response } from "express";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

const router: Router = Router();

const CATEGORIES = [
    "Meat",
    "Poultry",
    "Seafood",
    "Vegetables",
    "Fruit",
    "Bread & Bakery",
    "Prepared Meals",
    "Dairy",
    "Other",
] as const;

const responseSchema: Schema = {
    type: SchemaType.ARRAY,
    items: {
        type: SchemaType.OBJECT,
        properties: {
            name: { type: SchemaType.STRING, description: "Name of the food item" },
            category: {
                type: SchemaType.STRING,
                format: "enum",
                enum: [...CATEGORIES],
                description: "Category of the food item",
            },
            quantity: {
                type: SchemaType.NUMBER,
                description: "Estimated quantity, default 1",
            },
            unit: {
                type: SchemaType.STRING,
                description: "Unit of measurement, e.g. pcs, kg, bags",
            },
            confidence: {
                type: SchemaType.NUMBER,
                description: "Confidence score from 0 to 100",
            },
        },
        required: ["name", "category", "quantity", "unit", "confidence"],
    },
};

const PROMPT = `You are a food identification assistant for a home freezer storage app.
Analyze this image and identify all visible food items that could be stored in a freezer.

For each item, provide:
- name: a clear, concise name for the food item
- category: one of: ${CATEGORIES.join(", ")}
- quantity: estimated count (default to 1 if unclear)
- unit: appropriate unit (e.g. "pcs", "kg", "bags", "lbs", "portions")
- confidence: your confidence in the identification (0-100)

Return a JSON array of identified items.`;

router.post("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const { imageBase64 } = req.body as { imageBase64?: string };

        if (!imageBase64) {
            res.status(400).json({ error: "imageBase64 is required" });
            return;
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
            return;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema,
            },
        });

        // Strip data URL prefix if present
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const result = await model.generateContent([
            PROMPT,
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Data,
                },
            },
        ]);

        const response = result.response;
        const text = response.text();
        const items = JSON.parse(text);

        res.json({ items });
    } catch (error) {
        console.error("Error identifying food:", error);
        const message =
            error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ error: `Failed to identify food: ${message}` });
    }
});

export default router;
