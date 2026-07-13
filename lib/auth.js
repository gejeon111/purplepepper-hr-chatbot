const crypto = require("crypto");

const COOKIE_NAME = "pp_admin_session";

function getExpectedToken() {
  return crypto
    .createHmac("sha256", process.env.ADMIN_PASSWORD || "")
    .update("purplepepper-admin")
    .digest("hex");
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return Object.fromEntries(
    header
      .split(";")
      .filter(Boolean)
      .map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, decodeURIComponent(v.join("="))];
      })
  );
}

function isAdmin(req) {
  if (!process.env.ADMIN_PASSWORD) return false;
  const cookies = parseCookies(req);
  return cookies[COOKIE_NAME] === getExpectedToken();
}

module.exports = { COOKIE_NAME, getExpectedToken, parseCookies, isAdmin };
