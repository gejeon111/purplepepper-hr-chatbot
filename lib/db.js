const { sql } = require("@vercel/postgres");

async function ensureTables() {
  await sql`CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id),
    sender TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
}

module.exports = { sql, ensureTables };
