const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { Pool } = require("pg");
const { runMigrations } = require("../src/run-migration");
const { hashPassword } = require("../src/config/password");
const { operationsApp } = require("../tests/helpers/operationsApp");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });

const schema = `operations_e2e_${randomUUID().replaceAll("-", "")}`;
const connection = process.env.SPRINT2_TEST_DATABASE_URL ? { connectionString: process.env.SPRINT2_TEST_DATABASE_URL } : {
    host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD
};
const adminPool = new Pool(connection);
const pool = new Pool({ ...connection, options: `-c search_path=${schema}` });
let server, store, stopping = false;
async function stop() {
    if (stopping) return;
    stopping = true;
    if (server) await new Promise((resolve) => server.close(resolve));
    if (store) await store.close();
    await pool.end();
    await adminPool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await adminPool.end();
}
async function main() {
    await adminPool.query(`CREATE SCHEMA "${schema}"`);
    const client = await pool.connect();
    try { await runMigrations({ client, command: "up" }); } finally { client.release(); }
    const password = "Operations-only-E2E-123!";
    const hash = await hashPassword(password);
    const users = {};
    for (const role of ["admin", "project_manager", "engineer", "worker", "viewer", "accountant"]) {
        const roleId = (await pool.query("INSERT INTO roles(name) VALUES($1) RETURNING id", [role])).rows[0].id;
        users[role] = (await pool.query("INSERT INTO users(fullname,email,password_hash,role_id) VALUES($1,$2,$3,$4) RETURNING id", [role === "worker" ? "Đội trưởng kiểm thử" : `Kiểm thử ${role}`, `${role}@e2e.test`, hash, roleId])).rows[0].id;
    }
    const project = (await pool.query("INSERT INTO projects(name,location,start_date) VALUES('E2E công trường','Hà Nội','2026-10-03') RETURNING id")).rows[0].id;
    await pool.query("INSERT INTO project_members(project_id,user_id,role_id) SELECT $1,id,role_id FROM users", [project]);
    const item = (await pool.query("INSERT INTO work_items(project_id,title) VALUES($1,'Thi công móng') RETURNING id", [project])).rows[0].id;
    const tasks = (await pool.query("INSERT INTO tasks(work_item_id,name,duration_days) VALUES($1,'Đổ bê tông',3),($1,'Lắp thép',2),($1,'Dựng cốp pha',3),($1,'Kiểm tra móng',1) RETURNING id", [item])).rows.map((row) => row.id);
    const { app, store: sessionStore } = operationsApp(pool);
    store = sessionStore;
    app.get("/__fixture", (req, res) => res.json({ projectId: project, workItemId: item, tasks }));
    app.post("/__shutdown", (req, res) => { res.sendStatus(204); setImmediate(() => stop().catch(() => { process.exitCode = 1; })); });
    server = app.listen(3031, "127.0.0.1", () => console.log("Operations E2E API ready on 3031 (isolated schema)"));
}
process.once("SIGTERM", () => stop().catch(() => { process.exitCode = 1; }));
process.once("SIGINT", () => stop().catch(() => { process.exitCode = 1; }));
main().catch(async (error) => { console.error("E2E setup failed", error.code || error.message); await stop(); process.exitCode = 1; });
