import mysql from "mysql2/promise";

let pool: mysql.Pool;

export function getPool(): mysql.Pool {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST || "localhost",
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || "freezer_storage",
            waitForConnections: true,
            connectionLimit: 10,
        });
    }
    return pool;
}

export default { getPool };
