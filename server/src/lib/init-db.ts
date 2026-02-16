import pool from "./database.js";

export async function initDb(): Promise<void> {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS freezer_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(50) NOT NULL,
            quantity DECIMAL(10,2) NOT NULL,
            unit VARCHAR(50) NOT NULL,
            date_added DATE NULL,
            expiry_date DATE NOT NULL,
            notes TEXT
        )
    `);
    console.log("Database initialized: freezer_items table ready");
}
