import { execSync } from "node:child_process";

import { Client } from "pg";

import {
  ADMIN_DATABASE_URL,
  TEMPLATE_DB,
  TEST_WORKERS,
  workerDbName,
} from "./worker-count";

async function admin<T>(fn: (c: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: ADMIN_DATABASE_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/** Terminates other sessions so DROP/CREATE ... TEMPLATE can proceed. */
async function disconnectAll(c: Client, db: string) {
  await c.query(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
     WHERE datname = $1 AND pid <> pg_backend_pid()`,
    [db]
  );
}

export async function setup() {
  // Safety guard: abort if ADMIN_DATABASE_URL doesn't target the test
  // Postgres port. A misconfigured TEST_ADMIN_DATABASE_URL could point
  // at a production instance; the DROP DATABASE statements below would
  // then destroy real data. The default (localhost:5433) is safe; this
  // assertion catches only overrides that forgot to set the port.
  if (!ADMIN_DATABASE_URL.includes(":5433")) {
    throw new Error(
      `ADMIN_DATABASE_URL does not contain ':5433' — refusing to run ` +
        `test setup against a potentially non-test database. Got: ` +
        `${ADMIN_DATABASE_URL.replace(/\/\/[^@]*@/, "//***@")}`
    );
  }

  await admin(async (c) => {
    // Drop worker DBs left behind by a SIGKILLed run
    const stale = await c.query<{ datname: string }>(
      `SELECT datname FROM pg_database WHERE datname LIKE 'cc_test_w%'`
    );
    for (const { datname } of stale.rows) {
      await disconnectAll(c, datname);
      await c.query(`DROP DATABASE IF EXISTS "${datname}"`);
    }

    const exists = await c.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [TEMPLATE_DB]
    );
    if (exists.rowCount === 0) {
      await c.query(`CREATE DATABASE "${TEMPLATE_DB}"`);
    }
  });

  // Always run: a no-op when the template is already current.
  const templateUrl = ADMIN_DATABASE_URL.replace(/\/[^/]+$/, `/${TEMPLATE_DB}`);
  execSync("pnpm exec prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: templateUrl },
    stdio: "inherit",
  });

  await admin(async (c) => {
    // migrate deploy leaves a connection briefly; clear it before cloning.
    await disconnectAll(c, TEMPLATE_DB);
    for (let i = 1; i <= TEST_WORKERS; i++) {
      const db = workerDbName(i);
      await c.query(`DROP DATABASE IF EXISTS "${db}"`);
      await c.query(`CREATE DATABASE "${db}" TEMPLATE "${TEMPLATE_DB}"`);
    }
  });
}

export async function teardown() {
  await admin(async (c) => {
    for (let i = 1; i <= TEST_WORKERS; i++) {
      const db = workerDbName(i);
      await disconnectAll(c, db);
      await c.query(`DROP DATABASE IF EXISTS "${db}"`);
    }
  });
}
