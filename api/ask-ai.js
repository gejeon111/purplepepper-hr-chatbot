const { sql, ensureTables } = require("../lib/db");
const { askGemini } = require("../lib/gemini");

const PER_IP_LIMIT_PER_MINUTE = 8;
const GLOBAL_LIMIT_PER_DAY = 300;

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  await ensureTables();

  const { question } = req.body || {};
  if (!question || typeof question !== "string" || !question.trim() || question.length > 500) {
    res.status(400).json({ error: "question is required and must be 500 characters or fewer" });
    return;
  }

  await sql`DELETE FROM ai_rate_limits WHERE created_at < now() - interval '1 day'`;

  const ip = getClientIp(req);
  const { rows: ipRows } = await sql`
    SELECT COUNT(*)::int AS count FROM ai_rate_limits
    WHERE ip = ${ip} AND created_at > now() - interval '1 minute'
  `;
  const { rows: globalRows } = await sql`
    SELECT COUNT(*)::int AS count FROM ai_rate_limits
    WHERE created_at > now() - interval '1 day'
  `;

  if (ipRows[0].count >= PER_IP_LIMIT_PER_MINUTE || globalRows[0].count >= GLOBAL_LIMIT_PER_DAY) {
    res.status(200).json({ answer: null, reason: "rate_limited" });
    return;
  }

  await sql`INSERT INTO ai_rate_limits (ip) VALUES (${ip})`;

  const { rows: faqItems } = await sql`SELECT question, answer FROM faq_items ORDER BY id ASC`;

  try {
    const answer = await askGemini(faqItems, question.trim());
    res.status(200).json({ answer });
  } catch (err) {
    console.error("Gemini call failed", err);
    res.status(200).json({ answer: null, reason: "error" });
  }
};
