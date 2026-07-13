const { sql, ensureTables } = require("../../lib/db");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  await ensureTables();

  const { id, email, message } = req.body || {};
  if (!id || !email || !message) {
    res.status(400).json({ error: "id, email and message are required" });
    return;
  }

  const { rows: tickets } = await sql`SELECT * FROM tickets WHERE id = ${id} AND email = ${email}`;
  if (tickets.length === 0) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  await sql`INSERT INTO messages (ticket_id, sender, body) VALUES (${id}, 'user', ${message})`;
  await sql`UPDATE tickets SET status = 'open' WHERE id = ${id}`;

  const { rows: messages } = await sql`
    SELECT sender, body, created_at FROM messages WHERE ticket_id = ${id} ORDER BY created_at ASC
  `;
  res.status(200).json({ messages });
};
