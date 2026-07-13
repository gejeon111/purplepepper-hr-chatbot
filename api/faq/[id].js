const { sql, ensureTables } = require("../../lib/db");
const { isAdmin } = require("../../lib/auth");

async function validateCategory(categoryId) {
  const { rows } = await sql`SELECT * FROM categories WHERE id = ${categoryId}`;
  if (rows.length === 0) return "Category not found";
  if (rows[0].is_system) return "Cannot assign FAQ items to a system category";
  return null;
}

module.exports = async function handler(req, res) {
  if (!isAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await ensureTables();
  const { id } = req.query;

  if (req.method === "PUT") {
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
      UPDATE faq_items
      SET category_id = ${categoryId}, question = ${question}, answer = ${answer}, keywords = ${keywords || ""}
      WHERE id = ${id}
      RETURNING id
    `;
    if (rows.length === 0) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === "DELETE") {
    const { rows } = await sql`DELETE FROM faq_items WHERE id = ${id} RETURNING id`;
    if (rows.length === 0) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};
