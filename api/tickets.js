const { sql, ensureTables } = require("../lib/db");
const { Resend } = require("resend");
const { isAdmin } = require("../lib/auth");

const FROM_ADDRESS = "Purple Pepper Chatbot <onboarding@resend.dev>";

module.exports = async function handler(req, res) {
  await ensureTables();

  if (req.method === "GET") {
    if (!isAdmin(req)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { rows: tickets } = await sql`SELECT * FROM tickets WHERE status != 'deleted' ORDER BY created_at DESC`;
    const { rows: messages } = await sql`SELECT * FROM messages ORDER BY created_at ASC`;
    const grouped = tickets.map((t) => ({
      ...t,
      messages: messages.filter((m) => m.ticket_id === t.id)
    }));
    res.status(200).json({ tickets: grouped });
    return;
  }

  if (req.method === "POST") {
    const { question, name, phone, notifyEmail } = req.body || {};
    if (!question || !name || !phone) {
      res.status(400).json({ error: "question, name and phone are required" });
      return;
    }

    const { rows } = await sql`
      INSERT INTO tickets (name, phone, notify_email) VALUES (${name}, ${phone}, ${notifyEmail || null})
      RETURNING id
    `;
    const ticketId = rows[0].id;
    await sql`INSERT INTO messages (ticket_id, sender, body) VALUES (${ticketId}, 'user', ${question})`;

    if (process.env.RESEND_API_KEY && process.env.HR_NOTIFY_EMAIL) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: FROM_ADDRESS,
          to: process.env.HR_NOTIFY_EMAIL,
          subject: `[퍼플페퍼 챗봇] 새 문의 (HR-${ticketId})`,
          text: `문의자: ${name} (${phone})\n문의번호: HR-${ticketId}\n\n내용:\n${question}\n\n관리자 페이지에서 확인 후 답장해주세요.`
        });
      } catch (err) {
        console.error("Failed to send notification email", err);
      }
    }

    res.status(201).json({ ok: true, id: ticketId });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};
