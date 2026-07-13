const { sql } = require("@vercel/postgres");
const { Resend } = require("resend");
const { isAdmin } = require("../lib/auth");

const FROM_ADDRESS = "Purple Pepper Chatbot <onboarding@resend.dev>";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id, reply } = req.body || {};
  if (!id || !reply) {
    res.status(400).json({ error: "id and reply are required" });
    return;
  }

  const { rows } = await sql`
    UPDATE tickets SET reply = ${reply}, status = 'answered', replied_at = now()
    WHERE id = ${id}
    RETURNING email, question
  `;

  if (rows.length === 0) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: rows[0].email,
        subject: "[퍼플페퍼 HR] 문의하신 내용에 대한 답변입니다",
        text: `문의하신 내용:\n${rows[0].question}\n\n답변:\n${reply}`
      });
    } catch (err) {
      console.error("Failed to send reply email", err);
    }
  }

  res.status(200).json({ ok: true });
};
