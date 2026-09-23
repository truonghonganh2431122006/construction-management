const fs = require("fs");
const path = require("path");
const pool = require("./config/database");

async function runMigration() {
    try {
        const filePath = path.join(
            __dirname,
            "migrations",
            "001_create_users.sql"
        );

        const sql = fs.readFileSync(filePath, "utf8");

        await pool.query(sql);

        console.log("Migration chạy thành công!");

    } catch (error) {
        console.error(error.message);

    } finally {
        await pool.end();
    }
}

runMigration();