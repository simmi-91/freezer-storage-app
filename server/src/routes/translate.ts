import { Router, Request, Response } from "express";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

const router: Router = Router();

const CATEGORIES = [
    "Meat", "Poultry", "Seafood", "Vegetables", "Fruit",
    "Bread & Bakery", "Prepared Meals", "Dairy", "Other",
] as const;

const responseSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        suggestions: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    name: {
                        type: SchemaType.STRING,
                        description: "English translation of the food name",
                    },
                    category: {
                        type: SchemaType.STRING,
                        description: "Freezer storage category",
                        format: "enum",
                        enum: [...CATEGORIES],
                    },
                },
                required: ["name", "category"],
            },
            description: "Up to 3 English translations with categories",
        },
    },
    required: ["suggestions"],
};

const PROMPT = `You are a food name translator for a home freezer storage app.
The user will provide a food name (likely in Norwegian or another non-English language).
Translate it to English and return up to 3 alternative English names, ordered by most common first.
Keep names concise and practical (e.g. "Chicken Breasts" not "Boneless Skinless Chicken Breast Fillets").
If the input is already in English, return it as-is plus any common synonyms.
For each suggestion, classify it into exactly one category: ${CATEGORIES.join(", ")}.`;

router.post("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.body as { name?: string };

        if (!name || !name.trim()) {
            res.status(400).json({ error: "name is required" });
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

        const result = await model.generateContent(
            `${PROMPT}\n\nTranslate and categorize this food name: "${name.trim()}"`
        );

        const response = result.response;
        const text = response.text();
        const parsed = JSON.parse(text) as {
            suggestions: { name: string; category: string }[];
        };

        res.json({ suggestions: parsed.suggestions.slice(0, 3) });
    } catch (error) {
        console.error("Error translating name:", error);
        const message =
            error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ error: `Failed to translate name: ${message}` });
    }
});

export default router;
