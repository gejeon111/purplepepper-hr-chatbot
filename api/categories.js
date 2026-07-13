const { sql, ensureTables } = require("../lib/db");
const { isAdmin } = require("../lib/auth");

module.exports = async function handler(req, res) {
  await ensureTables();

  if (req.method === "GET") {
    const { rows } = await sql`SELECT * FROM categories ORDER BY parent_id ASC NULLS FIRST, sort_order ASC, id ASC`;
    res.status(200).json({ categories: rows });
    return;
  }

  if (req.method === "POST") {
    if (!isAdmin(req)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { label, parentId } = req.body || {};
    if (!label || !label.trim()) {
      res.status(400).json({ error: "label is required" });
      return;
    }

    let parent = null;
    if (parentId) {
      const { rows: parentRows } = await sql`SELECT * FROM categories WHERE id = ${parentId}`;
      if (parentRows.length === 0) {
        res.status(400).json({ error: "Parent category not found" });
        return;
      }
      parent = parentRows[0];
      if (parent.parent_id) {
        res.status(400).json({ error: "Subcategories cannot have their own subcategories" });
        return;
      }
      if (parent.is_system) {
        res.status(400).json({ error: "Cannot add a subcategory under a system category" });
        return;
      }
    }

    const { rows: maxRows } = await sql`
      SELECT COALESCE(MAX(sort_order), -1) AS max FROM categories
      WHERE parent_id IS NOT DISTINCT FROM ${parentId || null}
    `;
    const nextOrder = maxRows[0].max + 1;

    const { rows } = await sql`
      INSERT INTO categories (label, sort_order, is_system, parent_id)
      VALUES (${label.trim()}, ${nextOrder}, false, ${parentId || null})
      RETURNING id
    `;
    res.status(201).json({ ok: true, id: rows[0].id });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};
