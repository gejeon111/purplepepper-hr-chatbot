const { sql, ensureTables } = require("../../lib/db");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  await ensureTables();

  const { id, phone, message } = req.body || {};
  if (!id || !phone || !message) {
    res.status(400).json({ error: "id, phone and message are required" });
    return;
  }

  const displayNo = parseInt(id, 10);
  const { rows: tickets } = await sql`SELECT * FROM tickets WHERE display_no = ${displayNo} AND phone = ${phone}`;
  if (tickets.length === 0) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  if (tickets[0].status === "deleted") {
    res.status(400).json({ error: "이 문의는 삭제되어 더 이상 메시지를 남길 수 없습니다." });
    return;
  }

  const ticketId = tickets[0].id;
  await sql`INSERT INTO messages (ticket_id, sender, body) VALUES (${ticketId}, 'user', ${message})`;
  await sql`UPDATE tickets SET status = 'open' WHERE id = ${ticketId}`;

  const { rows: messages } = await sql`
    SELECT sender, body, created_at FROM messages WHERE ticket_id = ${ticketId} ORDER BY created_at ASC
  `;
  res.status(200).json({ messages });
};
