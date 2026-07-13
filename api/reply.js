const { sql, ensureTables } = require("../lib/db");
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

  await ensureTables();

  const { id, reply } = req.body || {};
  if (!id || !reply) {
    res.status(400).json({ error: "id and reply are required" });
    return;
  }

  const { rows: tickets } = await sql`SELECT * FROM tickets WHERE id = ${id}`;
  if (tickets.length === 0) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  await sql`INSERT INTO messages (ticket_id, sender, body) VALUES (${id}, 'hr', ${reply})`;
  await sql`UPDATE tickets SET status = 'answered' WHERE id = ${id}`;

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: tickets[0].email,
        subject: `[퍼플페퍼 HR] 문의(HR-${id})에 답변이 도착했습니다`,
        text: `문의하신 내용에 대한 답변이 도착했어요.\n챗봇에서 '인사팀 문의 > 문의 확인하기'를 선택하고 문의번호 HR-${id}와 이메일을 입력하면 확인하실 수 있습니다.`
      });
    } catch (err) {
      console.error("Failed to send notification email", err);
    }
  }

  res.status(200).json({ ok: true });
};
