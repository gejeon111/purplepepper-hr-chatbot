const { sql, ensureTables } = require("../lib/db");
const { isAdmin } = require("../lib/auth");

module.exports = async function handler(req, res) {
  await ensureTables();

  if (req.method === "GET") {
    const { rows } = await sql`SELECT * FROM categories ORDER BY sort_order ASC, id ASC`;
    res.status(200).json({ categories: rows });
    return;
  }

  if (req.method === "POST") {
    if (!isAdmin(req)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { label } = req.body || {};
    if (!label || !label.trim()) {
      res.status(400).json({ error: "label is required" });
      return;
    }

    const { rows: maxRows } = await sql`SELECT COALESCE(MAX(sort_order), -1) AS max FROM categories`;
    const nextOrder = maxRows[0].max + 1;

    const { rows } = await sql`
      INSERT INTO categories (label, sort_order, is_system)
      VALUES (${label.trim()}, ${nextOrder}, false)
      RETURNING id
    `;
    res.status(201).json({ ok: true, id: rows[0].id });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};
