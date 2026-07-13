const { sql, ensureTables } = require("../../lib/db");
const { isAdmin } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (!isAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await ensureTables();
  const { id } = req.query;

  const { rows: existingRows } = await sql`SELECT * FROM categories WHERE id = ${id}`;
  if (existingRows.length === 0) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  const existing = existingRows[0];

  if (req.method === "PUT") {
    const { label } = req.body || {};
    if (!label || !label.trim()) {
      res.status(400).json({ error: "label is required" });
      return;
    }

    await sql`UPDATE categories SET label = ${label.trim()} WHERE id = ${id}`;
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === "DELETE") {
    if (existing.is_system) {
      res.status(400).json({ error: "System category cannot be deleted" });
      return;
    }

    await sql`DELETE FROM faq_items WHERE category_id = ${id}`;
    await sql`DELETE FROM categories WHERE id = ${id}`;
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};
