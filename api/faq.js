const { sql, ensureTables } = require("../lib/db");
const { isAdmin } = require("../lib/auth");

async function validateCategory(categoryId) {
  const { rows } = await sql`SELECT * FROM categories WHERE id = ${categoryId}`;
  if (rows.length === 0) return "Category not found";
  if (rows[0].is_system) return "Cannot assign FAQ items to a system category";
  return null;
}

module.exports = async function handler(req, res) {
  await ensureTables();

  if (req.method === "GET") {
    const { rows } = await sql`
      SELECT id, category_id, question, answer, keywords
      FROM faq_items
      WHERE category_id IS NOT NULL
      ORDER BY category_id ASC, sort_order ASC, id ASC
    `;
    res.status(200).json({ items: rows });
    return;
  }

  if (req.method === "POST") {
    if (!isAdmin(req)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { categoryId, question, answer, keywords } = req.body || {};
    if (!categoryId || !question || !answer) {
      res.status(400).json({ error: "categoryId, question and answer are required" });
      return;
    }

    const validationError = await validateCategory(categoryId);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const { rows } = await sql`
      INSERT INTO faq_items (category_id, question, answer, keywords)
      VALUES (${categoryId}, ${question}, ${answer}, ${keywords || ""})
      RETURNING id
    `;
    res.status(201).json({ ok: true, id: rows[0].id });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};
