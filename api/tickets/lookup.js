const { sql, ensureTables } = require("../../lib/db");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  await ensureTables();

  const { id, phone } = req.query;
  if (!id || !phone) {
    res.status(400).json({ error: "id and phone are required" });
    return;
  }

  const { rows: tickets } = await sql`SELECT * FROM tickets WHERE id = ${id} AND phone = ${phone}`;
  if (tickets.length === 0) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const { rows: messages } = await sql`
    SELECT sender, body, created_at FROM messages WHERE ticket_id = ${id} ORDER BY created_at ASC
  `;
  res.status(200).json({ ticket: tickets[0], messages });
};
