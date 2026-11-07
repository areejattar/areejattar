
import "server-only";

import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";

const globalForPg = globalThis as unknown as {
  pgPool?: Pool;
};

function createPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing from environment variables.");
  }

  let ca: string;

  if (process.env.DATABASE_CA_CERT_BASE64) {
    ca = Buffer.from(
      process.env.DATABASE_CA_CERT_BASE64,
      "base64"
    ).toString("utf8");
  } else {
    const caPath = path.join(process.cwd(), "aiven-ca.pem");

    if (!fs.existsSync(caPath)) {
      throw new Error("Aiven CA certificate is missing.");
    }

    ca = fs.readFileSync(caPath, "utf8");
  }

  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      ca,
      rejectUnauthorized: true,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

export const pool = globalForPg.pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

export async function query<
  T extends Record<string, unknown> = Record<string, unknown>
>(text: string, params?: unknown[]) {
  return pool.query<T>(text, params);
}
