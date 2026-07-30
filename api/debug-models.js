module.exports = async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(200).json({ error: "no key" });
    return;
  }
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await r.json();
  const models = (data.models || []).map((m) => ({
    name: m.name,
    methods: m.supportedGenerationMethods
  }));
  res.status(200).json({ models });
};
