const form = document.querySelector("#api-form");
const urlInput = document.querySelector("#media-url");
const result = document.querySelector("#result");
const status = document.querySelector("#result-status");
const runButton = document.querySelector(".run-button");
const copyResult = document.querySelector("#copy-result");
const audioOption = document.querySelector("#audio-option");
const audioMode = document.querySelector("#audio-mode");
let platform = "tiktok";
let lastResponse = "";

function setPlatform(next) {
  platform = next;
  document.querySelectorAll(".platform-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.platform === next));
  urlInput.placeholder = next === "tiktok" ? "https://www.tiktok.com/@user/video/..." : "https://www.instagram.com/reel/...";
  audioOption.classList.toggle("visible", next === "instagram");
  if (next !== "instagram") audioMode.checked = false;
}

function setStatus(message, type = "") {
  status.textContent = message;
  status.className = `result-status ${type}`;
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const temp = document.createElement("textarea");
    temp.value = value;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
  }
}

document.querySelectorAll(".platform-tab").forEach(tab => tab.addEventListener("click", () => setPlatform(tab.dataset.platform)));
document.querySelector("#clear-url").addEventListener("click", () => {
  urlInput.value = "";
  urlInput.focus();
});
document.querySelector("#copy-example").addEventListener("click", () => copyText("curl -G --data-urlencode 'url=https://www.tiktok.com/@user/video/123...' https://your-domain.vercel.app/api/tiktok"));
document.querySelectorAll("[data-copy]").forEach(button => button.addEventListener("click", () => copyText(new URL(button.dataset.copy, location.origin).href)));
copyResult.addEventListener("click", () => lastResponse && copyText(lastResponse));

form.addEventListener("submit", async event => {
  event.preventDefault();
  const target = urlInput.value.trim();
  if (!target) return;
  const mode = platform === "instagram" && audioMode.checked ? "&mode=audio" : "";
  const endpoint = `/api/${platform}?url=${encodeURIComponent(target)}${mode}`;
  runButton.disabled = true;
  runButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
  result.textContent = "Request sedang diproses...";
  copyResult.disabled = true;
  setStatus("Menghubungi endpoint...");
  try {
    const response = await fetch(endpoint, { headers: { accept: "application/json" } });
    const data = await response.json();
    lastResponse = JSON.stringify(data, null, 2);
    result.textContent = lastResponse;
    copyResult.disabled = false;
    setStatus(response.ok ? `Selesai · HTTP ${response.status}` : `Request gagal · HTTP ${response.status}`, response.ok ? "success" : "error");
  } catch (error) {
    lastResponse = "";
    result.textContent = JSON.stringify({ success: false, error: { message: error.message || "Request gagal." } }, null, 2);
    setStatus("Tidak dapat menghubungi API.", "error");
  } finally {
    runButton.disabled = false;
    runButton.innerHTML = '<i class="fa-solid fa-play"></i> Jalankan';
  }
});