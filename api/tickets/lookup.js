const { sql, ensureTables } = require("../../lib/db");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  await ensureTables();

  const { id, phone } = req.query;
  if (!phone) {
    res.status(400).json({ error: "phone is required" });
    return;
  }

  if (!id) {
    const { rows: tickets } = await sql`
      SELECT display_no AS id, status, created_at FROM tickets WHERE phone = ${phone} ORDER BY created_at DESC
    `;
    if (tickets.length === 0) {
      res.status(404).json({ error: "No tickets found" });
      return;
    }
    res.status(200).json({ tickets });
    return;
  }

  const displayNo = parseInt(id, 10);
  const { rows: tickets } = await sql`SELECT * FROM tickets WHERE display_no = ${displayNo} AND phone = ${phone}`;
  if (tickets.length === 0) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const { rows: messages } = await sql`
    SELECT sender, body, created_at FROM messages WHERE ticket_id = ${tickets[0].id} ORDER BY created_at ASC
  `;
  res.status(200).json({ ticket: tickets[0], messages });
};
