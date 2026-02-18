import mysql from "mysql2/promise";

let pool: mysql.Pool;

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "";
const DB_PORT = Number(process.env.DB_PORT) || 3306;

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
    console.error(
      "Missing critical database environment variables. Check your .env file.",
    );
}

const poolConfig = {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
  
export function getPool(): mysql.Pool {
    if (!pool) {
        pool = mysql.createPool(poolConfig);

        pool
            .getConnection()
            .then((connection) => {
            console.log(
                `Database connection successful to: ${DB_NAME} on ${DB_HOST}:${DB_PORT} (Env: ${
                process.env.NODE_ENV || "development"
                })`,
            );
            connection.release();
            })
            .catch((err) => {
            console.error(
                `Database connection FAILED. Please ensure MySQL is running. Error:`,
                err.message,
            );
            });

    }
    return pool;
}

export default { getPool };
