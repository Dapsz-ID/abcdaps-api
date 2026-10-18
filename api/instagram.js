import crypto from "node:crypto";
import { json, getInput, validatePlatform, sendError, readBody } from "../lib/http.js";

const AES_KEY = Buffer.from("qwertyuioplkjhgf", "utf8");
const BASE_ORIGIN = "https://fastvideosave.net";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function encryptUrl(value) {
  const cipher = crypto.createCipheriv("aes-128-ecb", AES_KEY, null);
  return Buffer.concat([cipher.update(value, "utf8"), cipher.final()]).toString("hex");
}

async function requestAPI(endpoint, target) {
  const response = await fetch(endpoint, {
    headers: {
      accept: "*/*",
      origin: BASE_ORIGIN,
      referer: `${BASE_ORIGIN}/`,
      url: encryptUrl(target),
      "user-agent": USER_AGENT
    },
    signal: AbortSignal.timeout(25000)
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Provider Instagram mengembalikan HTTP ${response.status}.`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Respons provider Instagram bukan JSON yang valid.");
  }
}

async function extractInstagram(target, audio = false) {
  const data = await requestAPI(audio ? "https://api.videodropper.app/audio" : "https://api.videodropper.app/allinone", target);
  if (audio) {
    const media = (data.media || []).map(item => ({ url: item.url, poster: item.poster || null }));
    return { source_url: target, is_audio: Boolean(data.audio), media };
  }
  const videos = (data.video || []).map(item => ({ url: item.video, thumbnail: item.thumbnail || null })).filter(item => item.url);
  const images = (data.image || []).map(item => typeof item === "string" ? item : item.url || item.image).filter(Boolean);
  return {
    source_url: target,
    type: videos.length ? images.length ? "carousel" : "video" : "image",
    total_videos: videos.length,
    total_images: images.length,
    videos,
    images
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Gunakan GET atau POST." }, timestamp: Date.now() });
  }
  try {
    if (req.method === "POST") req.body = await readBody(req);
    const target = getInput(req);
    validatePlatform(target, "instagram");
    const audio = req.query?.mode === "audio" || req.body?.mode === "audio";
    const data = await extractInstagram(target, audio);
    return json(res, 200, { success: true, status_code: 200, data, timestamp: Date.now() });
  } catch (error) {
    return sendError(res, error);
  }
}