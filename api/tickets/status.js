const { sql, ensureTables } = require("../../lib/db");
const { isAdmin } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!isAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await ensureTables();

  const { id, action } = req.body || {};
  if (!id || !["close", "delete"].includes(action)) {
    res.status(400).json({ error: "id and a valid action (close, delete) are required" });
    return;
  }

  const { rows } = await sql`SELECT * FROM tickets WHERE id = ${id}`;
  if (rows.length === 0) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  if (action === "close") {
    await sql`UPDATE tickets SET status = 'closed' WHERE id = ${id}`;
  } else {
    await sql`INSERT INTO messages (ticket_id, sender, body) VALUES (${id}, 'hr', '관리자 권한으로 해당 문의가 삭제되었습니다.')`;
    await sql`UPDATE tickets SET status = 'deleted' WHERE id = ${id}`;
  }

  res.status(200).json({ ok: true });
};
