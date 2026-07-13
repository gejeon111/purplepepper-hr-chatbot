const { sql } = require("@vercel/postgres");
const { Resend } = require("resend");
const { isAdmin } = require("../lib/auth");

const FROM_ADDRESS = "Purple Pepper Chatbot <onboarding@resend.dev>";

async function ensureTable() {
  await sql`CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    email TEXT NOT NULL,
    reply TEXT,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT now(),
    replied_at TIMESTAMPTZ
  )`;
}

module.exports = async function handler(req, res) {
  await ensureTable();

  if (req.method === "GET") {
    if (!isAdmin(req)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { rows } = await sql`SELECT * FROM tickets ORDER BY created_at DESC`;
    res.status(200).json({ tickets: rows });
    return;
  }

  if (req.method === "POST") {
    const { question, email } = req.body || {};
    if (!question || !email) {
      res.status(400).json({ error: "question and email are required" });
      return;
    }

    const { rows } = await sql`
      INSERT INTO tickets (question, email) VALUES (${question}, ${email})
      RETURNING id
    `;

    if (process.env.RESEND_API_KEY && process.env.HR_NOTIFY_EMAIL) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: FROM_ADDRESS,
          to: process.env.HR_NOTIFY_EMAIL,
          subject: "[퍼플페퍼 챗봇] 새 문의가 접수되었습니다",
          text: `문의자: ${email}\n\n내용:\n${question}\n\n관리자 페이지에서 확인 후 답장해주세요.`
        });
      } catch (err) {
        console.error("Failed to send notification email", err);
      }
    }

    res.status(201).json({ ok: true, id: rows[0].id });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};
