const { sql, ensureTables } = require("../lib/db");
const { isAdmin } = require("../lib/auth");

const VALID_CATEGORIES = ["wifi", "leave", "supplies"];

module.exports = async function handler(req, res) {
  await ensureTables();

  if (req.method === "GET") {
    const { rows } = await sql`
      SELECT * FROM faq_items ORDER BY category ASC, sort_order ASC, id ASC
    `;
    res.status(200).json({ items: rows });
    return;
  }

  if (req.method === "POST") {
    if (!isAdmin(req)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { category, question, answer, keywords } = req.body || {};
    if (!category || !question || !answer) {
      res.status(400).json({ error: "category, question and answer are required" });
      return;
    }
    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ error: `category must be one of ${VALID_CATEGORIES.join(", ")}` });
      return;
    }

    const { rows } = await sql`
      INSERT INTO faq_items (category, question, answer, keywords)
      VALUES (${category}, ${question}, ${answer}, ${keywords || ""})
      RETURNING id
    `;
    res.status(201).json({ ok: true, id: rows[0].id });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};
