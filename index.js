// ✦ cu-visuals — Visual Layer for chuDICKuwu preset
// SillyTavern third-party extension

import { extension_settings } from "../../extensions.js";
import { saveSettingsDebounced, eventSource, event_types } from "../../../script.js";

const EXT_NAME = "cu-visuals";
const EXT_FOLDER = `scripts/extensions/third-party/${EXT_NAME}`;
const SCRIPT_PREFIX = "cu-v-";

// ─── Pack registry ────────────────────────────────────────────

const PACKS = [
  { id: "think-hider", icon: "🧠", label: "think hider",     desc: "Скрывает &lt;think&gt;…&lt;/think&gt; скаффолд из чата" },
  { id: "scene-sep",   icon: "✦",  label: "scene separator", desc: "Заменяет горизонтальный разделитель на ✦" },
  { id: "time-display",icon: "🕰️", label: "time display",    desc: "[TIME]…[/TIME] — шапка сообщения с датой" },
  { id: "letter",      icon: "✉️", label: "letter",          desc: "[LETTER from=\"…\"]…[/LETTER] — бумажное письмо" },
  { id: "phone",       icon: "📱", label: "phone messages",  desc: "[PHONE from=\"…\"]…[/PHONE] — экран телефона" },
  { id: "receipt",     icon: "🧾", label: "receipt",         desc: "[RECEIPT]…[/RECEIPT] — кассовый чек" },
  { id: "ticket",      icon: "🎫", label: "ticket",          desc: "[TICKET]…[/TICKET] — билет на поезд / самолёт" },
  { id: "newspaper",   icon: "📰", label: "newspaper",       desc: "[NEWSPAPER headline=\"…\"]…[/NEWSPAPER] — газетная вырезка" },
  { id: "diary",       icon: "📓", label: "diary",           desc: "[DIARY date=\"…\"]…[/DIARY] — страница дневника" },
  { id: "wanted",      icon: "🔴", label: "wanted poster",   desc: "[WANTED name=\"…\" reward=\"…\"]…[/WANTED] — листовка о розыске" },
  { id: "medical",     icon: "🏥", label: "medical document",desc: "[MEDICAL type=\"…\" patient=\"…\"]…[/MEDICAL] — справка / рецепт" },
  { id: "menu",        icon: "🍽️", label: "menu",            desc: "[MENU place=\"…\"]…[/MENU] — меню заведения" },
  { id: "quotes",      icon: "«»", label: "quotes & thoughts",desc: "CSS-оформление «ёлочек» и *мыслей*" },
];

// ─── Settings ─────────────────────────────────────────────────

function getSettings() {
  if (!extension_settings[EXT_NAME]) {
    extension_settings[EXT_NAME] = { enabled: [] };
  }
  return extension_settings[EXT_NAME];
}

// ─── Regex storage ────────────────────────────────────────────

function getRegexStore() {
  const candidates = ["regex_scripts", "global_regex", "character_regex"];
  for (const key of candidates) {
    if (Array.isArray(extension_settings[key])) return extension_settings[key];
  }
  extension_settings["regex_scripts"] = [];
  return extension_settings["regex_scripts"];
}

function removePack(packId) {
  const pfx = `${SCRIPT_PREFIX}${packId}-`;
  const store = getRegexStore();
  const filtered = store.filter((s) => !(s.id && s.id.startsWith(pfx)));
  store.splice(0, store.length, ...filtered);
}

async function injectPack(packId) {
  removePack(packId);
  try {
    const res = await fetch(`/${EXT_FOLDER}/regexes/${packId}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const scripts = await res.json();
    if (!Array.isArray(scripts)) throw new Error("not an array");
    getRegexStore().push(...scripts);
    console.log(`[cu-visuals] ✓ ${packId} (${scripts.length})`);
    return true;
  } catch (err) {
    console.error(`[cu-visuals] ✗ ${packId}:`, err);
    if (typeof toastr !== "undefined")
      toastr.error(`Не удалось загрузить пак "${packId}"`, "✦ cu-visuals");
    return false;
  }
}

// ─── Post-processors ──────────────────────────────────────────
// Regex injects placeholder divs with data-raw attributes.
// JS reads them and builds proper HTML tables/layouts.

function getAttr(el, attr) {
  // data-raw may be set as dataset or attribute depending on ST sanitization
  return decodeURIComponent(el.dataset[attr] || el.getAttribute(`data-${attr}`) || "");
}

// ── Receipt ───────────────────────────────────────────────────
function parseReceipts() {
  document.querySelectorAll(".cu-receipt[data-raw]").forEach((el) => {
    const raw = getAttr(el, "raw");
    el.removeAttribute("data-raw");
    if (!raw.trim()) return;

    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let store = "", date = "", total = "", paid = "", discount = "";
    const items = [];

    for (const line of lines) {
      if (line.startsWith("-")) { items.push(line.slice(1).trim()); continue; }
      const kv = line.match(/^([^:]+):\s*(.+)$/);
      if (!kv) continue;
      const k = kv[1].trim().toLowerCase(), v = kv[2].trim();
      if (/^(store|магазин|заведение)$/.test(k))     store = v;
      else if (/^(date|дата)$/.test(k))              date = v;
      else if (/^(total|итого)$/.test(k))            total = v;
      else if (/^(paid|оплата|оплачено)$/.test(k))   paid = v;
      else if (/^(discount|скидка)$/.test(k))        discount = v;
    }

    const rows = items.map((item) => {
      const m = item.match(/^(.+?)\s*[—–-]\s*([^\s].*)$/);
      return m
        ? `<tr><td>${m[1].trim()}</td><td>${m[2].trim()}</td></tr>`
        : `<tr><td colspan="2">${item}</td></tr>`;
    }).join("");

    el.innerHTML = `
      ${store    ? `<div class="cu-receipt-store">${store}</div>` : ""}
      ${date     ? `<div class="cu-receipt-date">${date}</div>` : ""}
      <hr class="cu-receipt-divider">
      <table class="cu-receipt-items"><tbody>
        ${rows}
        ${discount ? `<tr class="cu-receipt-discount-row"><td>скидка</td><td>${discount}</td></tr>` : ""}
      </tbody></table>
      ${total    ? `<div class="cu-receipt-total-row"><span>итого</span><span>${total}</span></div>` : ""}
      ${paid     ? `<div class="cu-receipt-paid">${paid}</div>` : ""}
      <div class="cu-receipt-thanks">спасибо за покупку</div>`;
  });
}

// ── Ticket ────────────────────────────────────────────────────
function parseTickets() {
  document.querySelectorAll(".cu-ticket[data-raw]").forEach((el) => {
    const raw = getAttr(el, "raw");
    el.removeAttribute("data-raw");
    if (!raw.trim()) return;

    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let type = "", from = "", to = "", date = "", time = "", seat = "", passenger = "";

    for (const line of lines) {
      const kv = line.match(/^([^:]+):\s*(.+)$/);
      if (!kv) continue;
      const k = kv[1].trim().toLowerCase(), v = kv[2].trim();
      if (/^(type|тип|вид)$/.test(k))                    type = v;
      else if (/^(from|откуда|из)$/.test(k))             from = v;
      else if (/^(to|куда|до)$/.test(k))                 to = v;
      else if (/^(date|дата)$/.test(k))                  date = v;
      else if (/^(time|время|отправление)$/.test(k))     time = v;
      else if (/^(seat|место|вагон|ряд|класс)$/.test(k)) seat = v;
      else if (/^(passenger|пассажир|имя)$/.test(k))     passenger = v;
    }

    const TYPE_ICONS = { поезд: "🚂", самолёт: "✈️", автобус: "🚌", концерт: "🎵", театр: "🎭", метро: "🚇" };
    const icon = Object.entries(TYPE_ICONS).find(([k]) => (type || "").toLowerCase().includes(k))?.[1] ?? "🎫";

    el.innerHTML = `
      <div class="cu-ticket-type">${icon} ${type || "билет"}</div>
      <div class="cu-ticket-route">
        ${from ? `<span class="cu-ticket-city">${from}</span>` : ""}
        ${from && to ? `<span class="cu-ticket-arrow">→</span>` : ""}
        ${to   ? `<span class="cu-ticket-city">${to}</span>` : ""}
      </div>
      <div class="cu-ticket-meta">
        ${date ? `<span>${date}</span>` : ""}
        ${time ? `<span class="cu-ticket-time">${time}</span>` : ""}
        ${seat ? `<span>место ${seat}</span>` : ""}
      </div>
      ${passenger ? `<div class="cu-ticket-passenger">${passenger}</div>` : ""}
      <div class="cu-ticket-barcode">▐▌▌▐▐▌▌▐▌▐▐▌▌▐▐▌▌▐▌▐▌▐▐▌</div>`;
  });
}

// ── Menu ──────────────────────────────────────────────────────
function parseMenus() {
  document.querySelectorAll(".cu-menu[data-raw]").forEach((el) => {
    const place = getAttr(el, "place");
    const raw   = getAttr(el, "raw");
    el.removeAttribute("data-raw");
    el.removeAttribute("data-place");
    if (!raw.trim()) return;

    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let html = "";

    for (const line of lines) {
      if (line.startsWith("#")) {
        html += `<div class="cu-menu-section">${line.replace(/^#+\s*/, "")}</div>`;
        continue;
      }
      if (line.startsWith("-")) {
        const content = line.slice(1).trim();
        const m = content.match(/^(.+?)\s*[—–-]\s*([^\s].*)$/);
        html += m
          ? `<div class="cu-menu-item"><span>${m[1].trim()}</span><span class="cu-menu-price">${m[2].trim()}</span></div>`
          : `<div class="cu-menu-item"><span>${content}</span></div>`;
      }
    }

    el.innerHTML = `
      <div class="cu-menu-header">${place || "меню"}</div>
      <div class="cu-menu-body">${html}</div>`;
  });
}

// ── Run all ───────────────────────────────────────────────────
function runPostProcessors() {
  parseReceipts();
  parseTickets();
  parseMenus();
}

// ─── UI ───────────────────────────────────────────────────────

function updateRow(packId, on) {
  const row = document.querySelector(`.cu-pack-row[data-pack="${packId}"]`);
  if (row) row.classList.toggle("cu-on", on);
}

function buildUI() {
  const container = document.getElementById("cu-visuals-packs");
  if (!container) return;

  const { enabled } = getSettings();

  container.innerHTML = PACKS.map((p) => {
    const on = enabled.includes(p.id);
    return `
      <div class="cu-pack-row${on ? " cu-on" : ""}" data-pack="${p.id}">
        <label class="cu-pack-label">
          <input type="checkbox" data-pack="${p.id}"${on ? " checked" : ""}>
          <span class="cu-pack-icon">${p.icon}</span>
          <span class="cu-pack-name">${p.label}</span>
        </label>
        <span class="cu-pack-desc">${p.desc}</span>
      </div>`;
  }).join("");

  container.querySelectorAll("input[data-pack]").forEach((cb) => {
    cb.addEventListener("change", async (e) => {
      const id = e.target.dataset.pack;
      const s  = getSettings();
      if (e.target.checked) {
        if (!s.enabled.includes(id)) s.enabled.push(id);
        const ok = await injectPack(id);
        if (!ok) {
          e.target.checked = false;
          s.enabled = s.enabled.filter((x) => x !== id);
        }
      } else {
        s.enabled = s.enabled.filter((x) => x !== id);
        removePack(id);
      }
      saveSettingsDebounced();
      updateRow(id, e.target.checked && s.enabled.includes(id));
    });
  });
}

// ─── Init ─────────────────────────────────────────────────────

jQuery(async () => {
  const s = getSettings();

  for (const id of s.enabled) {
    await injectPack(id);
  }

  const panelHtml = await $.get(`/${EXT_FOLDER}/settings.html`).catch((e) => {
    console.error("[cu-visuals] settings.html:", e);
    return null;
  });

  if (panelHtml) {
    $("#extensions_settings").append(panelHtml);
    buildUI();
  }

  // Run after every new AI / user message
  eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, runPostProcessors);
  eventSource.on(event_types.USER_MESSAGE_RENDERED,      runPostProcessors);
  // Once on load for pre-rendered chat history
  setTimeout(runPostProcessors, 500);

  console.log("[cu-visuals] ready. enabled:", s.enabled);
});
