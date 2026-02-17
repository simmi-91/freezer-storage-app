import { Router, Request, Response } from "express";
import { getPool } from "../lib/database.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

const router: Router = Router();

interface FreezerItemRow extends RowDataPacket {
    id: number;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    date_added: Date | string | null;
    expiry_date: Date | string;
    notes: string | null;
}

function formatDate(d: Date | string | null): string {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    // Use local date parts to avoid UTC timezone shift
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function rowToItem(row: FreezerItemRow) {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        quantity: Number(row.quantity),
        unit: row.unit,
        dateAdded: formatDate(row.date_added),
        expiryDate: formatDate(row.expiry_date),
        notes: row.notes ?? "",
    };
}

// GET /api/items
router.get("/", async (_req: Request, res: Response): Promise<void> => {
    try {
        const [rows] = await getPool().execute<FreezerItemRow[]>(
            "SELECT * FROM freezer_items ORDER BY expiry_date ASC"
        );
        res.json(rows.map(rowToItem));
    } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({ error: "Failed to fetch items" });
    }
});

// POST /api/items
router.post("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, category, quantity, unit, dateAdded, expiryDate, notes } = req.body;

        if (!name || !category || quantity == null || !unit || !expiryDate) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        const [result] = await getPool().execute<ResultSetHeader>(
            `INSERT INTO freezer_items (name, category, quantity, unit, date_added, expiry_date, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, category, quantity, unit, dateAdded || null, expiryDate, notes || ""]
        );

        const [rows] = await getPool().execute<FreezerItemRow[]>(
            "SELECT * FROM freezer_items WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json(rowToItem(rows[0]));
    } catch (error) {
        console.error("Error creating item:", error);
        res.status(500).json({ error: "Failed to create item" });
    }
});

// PUT /api/items/:id
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, category, quantity, unit, dateAdded, expiryDate, notes } = req.body;

        const fields: string[] = [];
        const values: unknown[] = [];

        if (name !== undefined) { fields.push("name = ?"); values.push(name); }
        if (category !== undefined) { fields.push("category = ?"); values.push(category); }
        if (quantity !== undefined) { fields.push("quantity = ?"); values.push(quantity); }
        if (unit !== undefined) { fields.push("unit = ?"); values.push(unit); }
        if (dateAdded !== undefined) { fields.push("date_added = ?"); values.push(dateAdded || null); }
        if (expiryDate !== undefined) { fields.push("expiry_date = ?"); values.push(expiryDate); }
        if (notes !== undefined) { fields.push("notes = ?"); values.push(notes); }

        if (fields.length === 0) {
            res.status(400).json({ error: "No fields to update" });
            return;
        }

        values.push(id);
        const [result] = await getPool().execute<ResultSetHeader>(
            `UPDATE freezer_items SET ${fields.join(", ")} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            res.status(404).json({ error: "Item not found" });
            return;
        }

        const [rows] = await getPool().execute<FreezerItemRow[]>(
            "SELECT * FROM freezer_items WHERE id = ?",
            [id]
        );

        res.json(rowToItem(rows[0]));
    } catch (error) {
        console.error("Error updating item:", error);
        res.status(500).json({ error: "Failed to update item" });
    }
});

// DELETE /api/items/:id
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const [result] = await getPool().execute<ResultSetHeader>(
            "DELETE FROM freezer_items WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            res.status(404).json({ error: "Item not found" });
            return;
        }

        res.status(204).end();
    } catch (error) {
        console.error("Error deleting item:", error);
        res.status(500).json({ error: "Failed to delete item" });
    }
});

export default router;
