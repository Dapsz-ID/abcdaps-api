export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export function getInput(req) {
  const value = req.method === "GET" ? req.query?.url : req.body?.url;
  if (typeof value !== "string" || !value.trim()) {
    throw Object.assign(new Error("Parameter url wajib diisi."), { status: 400, code: "URL_REQUIRED" });
  }
  const raw = value.trim();
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw Object.assign(new Error("URL tidak valid."), { status: 400, code: "INVALID_URL" });
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw Object.assign(new Error("Protokol URL tidak didukung."), { status: 400, code: "INVALID_PROTOCOL" });
  }
  return parsed.href;
}

export function validatePlatform(url, platform) {
  const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  const valid = platform === "tiktok"
    ? host === "tiktok.com" || host.endsWith(".tiktok.com")
    : host === "instagram.com" || host.endsWith(".instagram.com");
  if (!valid) throw Object.assign(new Error(`URL harus berasal dari ${platform}.`), { status: 400, code: "UNSUPPORTED_HOST" });
}

export function sendError(res, error) {
  const status = Number(error?.status) || 502;
  json(res, status, {
    success: false,
    status_code: status,
    error: {
      code: error?.code || "EXTRACTION_FAILED",
      message: String(error?.message || "Gagal mengambil media.")
    },
    timestamp: Date.now()
  });
}

export async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("Body harus berupa JSON yang valid."), { status: 400, code: "INVALID_JSON" });
  }
}