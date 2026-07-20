const { sql } = require("@vercel/postgres");

const LEGACY_CATEGORY_LABELS = {
  wifi: "📶 와이파이",
  leave: "🗓️ 연차 및 휴가",
  supplies: "🖇️ 사무실 물품"
};

async function ensureTables() {
  await sql`CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    email TEXT,
    name TEXT,
    phone TEXT,
    notify_email TEXT,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`ALTER TABLE tickets ALTER COLUMN email DROP NOT NULL`;
  await sql`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS name TEXT`;
  await sql`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS phone TEXT`;
  await sql`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS notify_email TEXT`;
  await sql`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS contact_methods TEXT`;
  await sql`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS display_no INTEGER`;
  await sql`CREATE SEQUENCE IF NOT EXISTS ticket_display_no_seq`;

  const { rows: backfilled } = await sql`
    UPDATE tickets SET display_no = sub.rn
    FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn FROM tickets WHERE display_no IS NULL) sub
    WHERE tickets.id = sub.id
    RETURNING tickets.id
  `;
  if (backfilled.length > 0) {
    await sql`SELECT setval('ticket_display_no_seq', (SELECT COALESCE(MAX(display_no), 0) FROM tickets))`;
  }
  await sql`CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id),
    sender TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    label TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_system BOOLEAN NOT NULL DEFAULT false,
    parent_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id)`;
  await sql`CREATE TABLE IF NOT EXISTS faq_items (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL DEFAULT '',
    category_id INTEGER REFERENCES categories(id),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`ALTER TABLE faq_items ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id)`;
  await sql`ALTER TABLE faq_items ALTER COLUMN category DROP NOT NULL`;

  const { rows: catCount } = await sql`SELECT COUNT(*)::int AS count FROM categories`;
  if (catCount[0].count === 0) {
    await sql`INSERT INTO categories (label, sort_order, is_system) VALUES
      ('📶 와이파이', 0, false),
      ('🗓️ 연차 및 휴가', 1, false),
      ('🖇️ 사무실 물품', 2, false),
      ('✉️ 인사팀 문의', 3, true)`;
  }

  for (const [slug, label] of Object.entries(LEGACY_CATEGORY_LABELS)) {
    await sql`
      UPDATE faq_items SET category_id = (SELECT id FROM categories WHERE label = ${label} LIMIT 1)
      WHERE category = ${slug} AND category_id IS NULL
    `;
  }

  await sql`CREATE TABLE IF NOT EXISTS ai_rate_limits (
    id SERIAL PRIMARY KEY,
    ip TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
}

module.exports = { sql, ensureTables };
