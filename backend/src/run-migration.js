const fs = require("fs");
const path = require("path");
const { createHash } = require("crypto");

const LEGACY_MIGRATION = "001_create_users.sql";
const LEGACY_PROGRESS_MIGRATIONS = new Map([
    ["012_add_actual_progress.sql", "7898766f8a5ebc1888ccc61575e2df0f0b6bbb2f2c5732134995000974d42dee"],
    ["015_add_actual_progress.sql", null]
]);
const PROGRESS_MIGRATION = "016_add_actual_progress.sql";
const COMMANDS = ["up", "down", "status", "baseline"];

function readMigrations(directory) {
    const names = fs.readdirSync(directory)
        .filter(name => /^\d{3}_[a-z0-9_]+\.sql$/.test(name))
        .sort();

    if (names.length === 0) {
        throw new Error("No migrations found.");
    }

    const versions = names.map(name => name.slice(0, 3));
    if (new Set(versions).size !== versions.length) {
        throw new Error("Migration version numbers must be unique.");
    }

    return names.map(name => {
        // Keep checksums stable across Windows and Linux checkouts.
        const sql = fs.readFileSync(path.join(directory, name), "utf8")
            .replace(/\r\n/g, "\n");
        const downPath = path.join(directory, name.replace(/\.sql$/, ".down.sql"));

        return {
            name,
            sql,
            checksum: createHash("sha256").update(sql).digest("hex"),
            downSql: fs.existsSync(downPath)
                ? fs.readFileSync(downPath, "utf8")
                : null
        };
    });
}

function validateHistory(migrations, applied) {
    const migrationIndexes = new Map(migrations.map((migration, index) => [migration.name, index]));
    let previousIndex = -1;
    for (const entry of applied) {
        const index = migrationIndexes.get(entry.name);
        const migration = migrations[index];
        if (index === undefined || index <= previousIndex) {
            throw new Error("Migration history does not match the ordered migration files.");
        }
        if (migration.checksum !== entry.checksum) {
            throw new Error(`Applied migration has changed: ${entry.name}`);
        }
        previousIndex = index;
    }
}

async function adoptLegacyProgressMigration(client, migrations, applied, { record = true } = {}) {
    const legacy = applied.find(entry => LEGACY_PROGRESS_MIGRATIONS.has(entry.name));
    if (!legacy) return applied;
    const expectedChecksum = LEGACY_PROGRESS_MIGRATIONS.get(legacy.name);
    const progressMigration = migrations.find(migration => migration.name === PROGRESS_MIGRATION);
    if (!progressMigration
        || (expectedChecksum === null
            ? legacy.checksum !== progressMigration.checksum
            : legacy.checksum !== expectedChecksum)) {
        throw new Error("Legacy actual-progress migration checksum is unknown; migration history was not changed.");
    }

    if (!progressMigration || applied.some(entry => entry.name === PROGRESS_MIGRATION)) {
        throw new Error("Cannot safely reconcile the legacy actual-progress migration history.");
    }

    const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'tasks'
          AND column_name = ANY($1::text[])
    `, [["actual_start_date", "actual_end_date", "percent_complete"]]);
    const expectedColumns = new Map([
        ["actual_start_date", ["date", "YES"]],
        ["actual_end_date", ["date", "YES"]],
        ["percent_complete", ["integer", "NO", "0"]]
    ]);
    for (const column of columns.rows) {
        if (expectedColumns.has(column.column_name)) {
            const expected = expectedColumns.get(column.column_name);
            if (column.data_type !== expected[0] || column.is_nullable !== expected[1]
                || (expected[2] !== undefined && column.column_default !== expected[2])) {
                throw new Error("Legacy actual-progress schema does not match; migration history was not changed.");
            }
            expectedColumns.delete(column.column_name);
        }
    }
    if (expectedColumns.size > 0) {
        throw new Error("Legacy actual-progress columns are incomplete; migration history was not changed.");
    }

    const constraints = await client.query(`
        SELECT conname, contype, convalidated, pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE conrelid = 'tasks'::regclass
          AND conname = ANY($1::text[])
    `, [["tasks_percent_complete_check", "tasks_actual_dates_order_check"]]);
    const constraintDefinitions = new Map(constraints.rows.map(row => [row.conname, row]));
    const percentConstraint = constraintDefinitions.get("tasks_percent_complete_check");
    const datesConstraint = constraintDefinitions.get("tasks_actual_dates_order_check");
    const compactDefinition = definition => definition.toLowerCase().replace(/\s/g, "");
    if (!percentConstraint || percentConstraint.contype !== "c" || !percentConstraint.convalidated
        || !compactDefinition(percentConstraint.definition).includes("percent_complete>=0")
        || !compactDefinition(percentConstraint.definition).includes("percent_complete<=100")
        || !datesConstraint || datesConstraint.contype !== "c" || !datesConstraint.convalidated
        || !compactDefinition(datesConstraint.definition).includes("actual_start_dateisnull")
        || !compactDefinition(datesConstraint.definition).includes("actual_end_dateisnull")
        || !compactDefinition(datesConstraint.definition).includes("actual_end_date>=actual_start_date")) {
        throw new Error("Legacy actual-progress constraints are incomplete; migration history was not changed.");
    }

    if (record) {
        await client.query(
            "UPDATE schema_migrations SET name = $1, checksum = $2 WHERE name = $3 AND checksum = $4",
            [progressMigration.name, progressMigration.checksum, legacy.name, legacy.checksum]
        );
    }
    return applied
        .filter(entry => entry !== legacy)
        .concat({ name: progressMigration.name, checksum: progressMigration.checksum })
        .sort((left, right) => left.name.localeCompare(right.name));
}

async function validateLegacyUsers(client) {
    const { rows } = await client.query(`
        SELECT column_name, data_type, character_maximum_length, is_nullable,
               column_default
        FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'users'
        ORDER BY ordinal_position
    `);

    const expected = [
        ["id", "integer", null, "NO"],
        ["username", "character varying", 100, "NO"],
        ["email", "character varying", 150, "NO"],
        ["password", "character varying", 255, "NO"],
        ["created_at", "timestamp without time zone", null, "YES"],
        ["updated_at", "timestamp without time zone", null, "YES"]
    ];
    const actual = rows.map(row => [
        row.column_name, row.data_type, row.character_maximum_length, row.is_nullable
    ]);
    const defaultsMatch = rows.length === 6
        && /^nextval\(/.test(rows[0].column_default || "")
        && rows.slice(1, 4).every(row => row.column_default === null)
        && rows.slice(4).every(row => row.column_default === "CURRENT_TIMESTAMP");

    if (JSON.stringify(actual) !== JSON.stringify(expected) || !defaultsMatch) {
        throw new Error("Baseline refused: users does not match the original T-01 schema.");
    }

    const constraints = await client.query(`
        SELECT pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE conrelid = 'users'::regclass AND contype IN ('p', 'u')
    `);
    const definitions = constraints.rows.map(row => row.definition);
    if (!definitions.includes("PRIMARY KEY (id)") || !definitions.includes("UNIQUE (email)")) {
        throw new Error("Baseline refused: users must have a primary key on id and unique email.");
    }
}

async function createHistory(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            name VARCHAR(255) PRIMARY KEY,
            checksum VARCHAR(64) NOT NULL,
            applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

async function recordMigration(client, migration) {
    await client.query(
        "INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)",
        [migration.name, migration.checksum]
    );
}

async function runMigrations({
    client,
    command = "up",
    directory = path.join(__dirname, "migrations")
}) {
    if (!COMMANDS.includes(command)) {
        throw new Error(`Unknown migration command. Use: ${COMMANDS.join(", ")}.`);
    }

    const migrations = readMigrations(directory);
    const messages = [];
    await client.query(command === "status" ? "BEGIN READ ONLY" : "BEGIN");

    try {
        // Released automatically on COMMIT/ROLLBACK; prevent concurrent runners.
        const lock = await client.query(`
            SELECT pg_try_advisory_xact_lock(
                hashtext(current_database()),
                hashtext(current_schema() || ':construction-management:migrations')
            ) AS locked
        `);
        if (!lock.rows[0].locked) {
            throw new Error("Another migration runner is active. Try again after it finishes.");
        }

        const history = await client.query(
            "SELECT to_regclass('schema_migrations') IS NOT NULL AS present"
        );
        const applied = history.rows[0].present
            ? (await client.query("SELECT name, checksum FROM schema_migrations ORDER BY name")).rows
            : [];
        const reconciled = command === "up" || command === "status"
            ? await adoptLegacyProgressMigration(client, migrations, applied, { record: command === "up" })
            : applied;
        validateHistory(migrations, reconciled);

        if (command === "status") {
            for (const [index, migration] of migrations.entries()) {
                messages.push(`${reconciled.some(entry => entry.name === migration.name) ? "applied" : "pending"}: ${migration.name}`);
            }
        } else if (command === "baseline") {
            if (reconciled.length !== 0 || migrations[0].name !== LEGACY_MIGRATION) {
                throw new Error("Baseline is only for an existing T-01 database with no recorded migrations.");
            }
            await validateLegacyUsers(client);
            await createHistory(client);
            await recordMigration(client, migrations[0]);
            messages.push(`Recorded existing schema: ${LEGACY_MIGRATION}`);
        } else if (command === "up") {
            if (reconciled.length === 0 && migrations[0].name === LEGACY_MIGRATION) {
                const users = await client.query("SELECT to_regclass('users') IS NOT NULL AS present");
                if (users.rows[0].present) {
                    throw new Error("Existing users table detected. Review and run npm run migrate:baseline first.");
                }
            }

            const appliedNames = new Set(reconciled.map(entry => entry.name));
            const pending = migrations.filter(migration => !appliedNames.has(migration.name));
            if (pending.length > 0) {
                await createHistory(client);
                for (const migration of pending) {
                    await client.query(migration.sql);
                    await recordMigration(client, migration);
                    messages.push(`Applied: ${migration.name}`);
                }
            } else {
                messages.push("No pending migrations.");
            }
        } else if (reconciled.length === 0) {
            messages.push("No migrations to rollback.");
        } else {
            const appliedNames = new Set(reconciled.map(entry => entry.name));
            const latest = migrations.filter(migration => appliedNames.has(migration.name)).at(-1);
            if (!latest.downSql) {
                throw new Error(`No rollback file for ${latest.name}; the original schema is preserved.`);
            }
            await client.query(latest.downSql);
            await client.query("DELETE FROM schema_migrations WHERE name = $1", [latest.name]);
            messages.push(`Rolled back: ${latest.name}`);
        }

        await client.query("COMMIT");
        return messages;
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            throw new AggregateError(
                [error, rollbackError],
                "Migration and transaction rollback both failed.",
                { cause: rollbackError }
            );
        }
        throw error;
    }
}

async function main() {
    const command = process.argv[2] || "up";
    if (process.argv.length > 3 || !COMMANDS.includes(command)) {
        throw new Error(`Usage: node src/run-migration.js [${COMMANDS.join("|")}]`);
    }

    const pool = require("./config/database");
    let client;
    try {
        client = await pool.connect();
        const messages = await runMigrations({ client, command });
        messages.forEach(message => console.log(message));
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    });
}

module.exports = { runMigrations };
