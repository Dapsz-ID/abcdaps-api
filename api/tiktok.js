import { json, getInput, validatePlatform, sendError, readBody } from "../lib/http.js";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function first(...values) {
  return values.find(value => value !== undefined && value !== null && value !== "") ?? "";
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function urlFrom(node) {
  return first(node?.url_list?.[0], node?.urlList?.[0], node?.url, node);
}

function normalizeMobile(item, canonicalURL) {
  const authorNode = item.author || {};
  const statsNode = item.statistics || {};
  const videoNode = item.video || {};
  const musicNode = item.music || {};
  const images = list(item.image_post_info?.images).map(image => urlFrom(image.display_image)).filter(Boolean);
  const bitrates = list(videoNode.bitrate).map(entry => ({
    quality_type: entry.gear_name || "",
    bitrate: Number(entry.bit_rate || 0),
    codec_type: String(entry.play_addr?.data_size || ""),
    url: urlFrom(entry.play_addr)
  })).filter(entry => entry.url);
  const author = {
    id: String(first(authorNode.uid, "")),
    unique_id: String(first(authorNode.unique_id, "")),
    nickname: first(authorNode.nickname),
    avatar: urlFrom(authorNode.avatar_thumb),
    avatar_larger: urlFrom(authorNode.avatar_larger),
    signature: authorNode.signature || "",
    verified: Boolean(authorNode.custom_verify),
    sec_uid: authorNode.sec_uid || "",
    stats: {
      follower_count: Number(authorNode.follower_count || 0),
      following_count: Number(authorNode.following_count || 0),
      heart_count: Number(authorNode.total_favorited || 0),
      video_count: Number(authorNode.aweme_count || 0)
    }
  };
  const video = images.length ? undefined : {
    no_watermark_url: urlFrom(videoNode.play_addr),
    watermark_url: urlFrom(videoNode.download_addr),
    duration_seconds: Math.floor(Number(videoNode.duration || 0) / 1000),
    width: Number(videoNode.width || 0),
    height: Number(videoNode.height || 0),
    ratio: videoNode.ratio || "",
    definition: videoNode.definition || "",
    adaptive_bitrates: bitrates
  };
  return {
    id: String(item.aweme_id || item.id || ""),
    type: images.length ? "image_slide" : "video",
    source_engine: "official_mobile_api",
    description: item.desc || "",
    created_at: Number(item.create_time || 0),
    region: item.region || "",
    is_ad: Boolean(item.is_ads),
    is_aigc: false,
    cover: urlFrom(videoNode.cover),
    dynamic_cover: urlFrom(videoNode.dynamic_cover),
    author,
    stats: {
      plays: Number(statsNode.play_count || 0),
      likes: Number(statsNode.digg_count || 0),
      comments: Number(statsNode.comment_count || 0),
      shares: Number(statsNode.share_count || 0),
      bookmarks: Number(statsNode.collect_count || 0)
    },
    music: {
      id: String(musicNode.id || ""),
      title: musicNode.title || "",
      author: musicNode.author || "",
      play_url: urlFrom(musicNode.play_url),
      duration_seconds: Number(musicNode.duration || 0),
      cover: urlFrom(musicNode.cover_large),
      original: Boolean(musicNode.is_original_sound)
    },
    ...(video ? { video } : {}),
    images,
    challenges: list(item.cha_list).map(challenge => ({
      id: String(challenge.cid || ""),
      title: challenge.cha_name || "",
      desc: challenge.desc || ""
    })),
    canonical_url: canonicalURL
  };
}

function normalizeWeb(item, canonicalURL) {
  const authorNode = item.author || {};
  const statsNode = item.stats || {};
  const videoNode = item.video || {};
  const musicNode = item.music || {};
  const images = list(item.imagePost?.images).map(image => first(image.imageURL?.urlList?.[0])).filter(Boolean);
  const video = images.length ? undefined : {
    no_watermark_url: first(videoNode.playAddr),
    watermark_url: first(videoNode.downloadAddr),
    duration_seconds: Number(videoNode.duration || 0),
    width: Number(videoNode.width || 0),
    height: Number(videoNode.height || 0),
    ratio: videoNode.ratio || "",
    format: videoNode.format || "",
    codec_type: videoNode.codecType || "",
    definition: videoNode.definition || "",
    adaptive_bitrates: list(videoNode.bitrateInfo).map(entry => ({
      quality_type: entry.QualityType || "",
      bitrate: Number(entry.Bitrate || 0),
      codec_type: entry.CodecType || "",
      url: first(entry.PlayAddr?.UrlList?.[0])
    })).filter(entry => entry.url),
    subtitles: list(videoNode.subtitleInfos).map(entry => ({
      language: entry.LanguageCodeName || "",
      url: entry.Url || "",
      format: entry.Format || ""
    })).filter(entry => entry.url)
  };
  return {
    id: String(item.id || ""),
    type: images.length ? "image_slide" : "video",
    source_engine: "official_web_ssr",
    description: item.desc || "",
    created_at: Number(item.createTime || 0),
    region: item.locationCreated || "",
    is_ad: Boolean(item.isAd),
    is_aigc: Boolean(item.IsAigc),
    cover: first(videoNode.cover),
    dynamic_cover: first(videoNode.dynamicCover),
    author: {
      id: String(authorNode.id || ""),
      unique_id: authorNode.uniqueId || "",
      nickname: authorNode.nickname || "",
      avatar: authorNode.avatarThumb || "",
      avatar_larger: authorNode.avatarLarger || "",
      signature: authorNode.signature || "",
      verified: Boolean(authorNode.verified),
      sec_uid: authorNode.secUid || "",
      stats: {
        follower_count: Number(item.authorStats?.followerCount || 0),
        following_count: Number(item.authorStats?.followingCount || 0),
        heart_count: Number(item.authorStats?.heartCount || 0),
        video_count: Number(item.authorStats?.videoCount || 0)
      }
    },
    stats: {
      plays: Number(statsNode.playCount || 0),
      likes: Number(statsNode.diggCount || 0),
      comments: Number(statsNode.commentCount || 0),
      shares: Number(statsNode.shareCount || 0),
      bookmarks: Number(statsNode.collectCount || 0)
    },
    music: {
      id: String(musicNode.id || ""),
      title: musicNode.title || "",
      author: musicNode.authorName || "",
      play_url: musicNode.playUrl || "",
      duration_seconds: Number(musicNode.duration || 0),
      cover: musicNode.coverLarge || "",
      original: Boolean(musicNode.original)
    },
    ...(video ? { video } : {}),
    images,
    challenges: list(item.challenges).map(challenge => ({
      id: String(challenge.id || ""),
      title: challenge.title || "",
      desc: challenge.desc || ""
    })),
    canonical_url: canonicalURL
  };
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(25000),
    headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9,id;q=0.8", ...(options.headers || {}) },
    redirect: "follow"
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`TikTok mengembalikan HTTP ${response.status}.`);
  return { text, url: response.url };
}

async function extractTikTok(target) {
  let canonicalURL = target;
  let awemeID = "";
  const input = target.trim();
  if (/^\d{17,21}$/.test(input)) {
    awemeID = input;
    canonicalURL = `https://www.tiktok.com/@user/video/${input}`;
  } else {
    try {
      const resolved = await fetchText(input, { method: "GET", headers: { accept: "text/html,application/xhtml+xml,*/*" } });
      canonicalURL = resolved.url || input;
    } catch {}
    awemeID = canonicalURL.match(/(?:video|photo)\/(\d{17,21})/)?.[1] || "";
  }

  if (awemeID) {
    const deviceID = String(7250000000000000000n + BigInt(Math.floor(Math.random() * 90000000000000000)));
    const params = new URLSearchParams({
      aweme_id: awemeID,
      version_code: "260103",
      app_name: "musical_ly",
      channel: "googleplay",
      device_platform: "android",
      aid: "1233",
      device_id: deviceID,
      os_version: "13"
    });
    for (const host of ["api16-normal-c-useast1a.tiktokv.com", "api22-normal-c-useast1a.tiktokv.com", "api.tiktokv.com"]) {
      try {
        const result = await fetchText(`https://${host}/aweme/v1/feed/?${params}`, {
          headers: {
            "user-agent": "com.zhiliaoapp.musically/2022600030 (Linux; U; Android 13; en_US; Pixel 7; Build/TQ3A.230901.001;tt-ok/3.12.13.1)",
            accept: "application/json"
          }
        });
        const item = JSON.parse(result.text).aweme_list?.[0];
        if (item) return normalizeMobile(item, canonicalURL);
      } catch {}
    }
  }

  const result = await fetchText(canonicalURL, { headers: { accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" } });
  const match = result.text.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error("Data TikTok tidak ditemukan. Konten mungkin privat, dihapus, atau dibatasi.");
  const root = JSON.parse(match[1]);
  const scope = root.__DEFAULT_SCOPE__ || {};
  let item;
  for (const [key, value] of Object.entries(scope)) {
    if (key.includes("video-detail")) {
      item = value?.itemInfo?.itemStruct;
      break;
    }
  }
  item ||= scope["webapp.video-detail"]?.itemInfo?.itemStruct;
  if (!item) throw new Error("Data media TikTok tidak tersedia pada halaman ini.");
  return normalizeWeb(item, result.url || canonicalURL);
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Gunakan GET atau POST." }, timestamp: Date.now() });
  }
  try {
    if (req.method === "POST") req.body = await readBody(req);
    const target = getInput(req);
    validatePlatform(target, "tiktok");
    const data = await extractTikTok(target);
    return json(res, 200, { success: true, status_code: 200, data, timestamp: Date.now() });
  } catch (error) {
    return sendError(res, error);
  }
}