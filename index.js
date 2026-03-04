// ✦ cu-visuals — Visual Layer for chuDICKuwu preset
// SillyTavern third-party extension
// No ES module imports — uses ST globals directly for maximum compatibility

(async function () {
  "use strict";

  const EXT_NAME    = "cu-visuals";
  const EXT_FOLDER  = `scripts/extensions/third-party/${EXT_NAME}`;
  const SCRIPT_PFX  = "cu-v-";

  // ─── ST globals (safe accessors) ──────────────────────────────

  function getExtSettings() {
    // extension_settings is a global in all ST versions
    if (!window.extension_settings) window.extension_settings = {};
    if (!window.extension_settings[EXT_NAME]) {
      window.extension_settings[EXT_NAME] = { enabled: [] };
    }
    return window.extension_settings[EXT_NAME];
  }

  function save() {
    if (typeof window.saveSettingsDebounced === "function") {
      window.saveSettingsDebounced();
    }
  }

  // ─── Regex store ──────────────────────────────────────────────

 function getRegexStore() {
    if (!window.extension_settings) window.extension_settings = {};
    if (!window.extension_settings.regex) window.extension_settings.regex = {};
    if (!Array.isArray(window.extension_settings.regex.scripts)) {
      window.extension_settings.regex.scripts = [];
    }
    return window.extension_settings.regex.scripts;
  }

  function removePack(packId) {
    const pfx = `${SCRIPT_PFX}${packId}-`;
    const store = getRegexStore();
    const keep = store.filter(s => !(s.id && s.id.startsWith(pfx)));
    store.splice(0, store.length, ...keep);
  }

  async function injectPack(packId) {
    removePack(packId);
    try {
      const res = await fetch(`/${EXT_FOLDER}/${packId}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const scripts = await res.json();
      if (!Array.isArray(scripts)) throw new Error("not array");
      getRegexStore().push(...scripts);
      console.log(`[cu-visuals] ✓ ${packId} (${scripts.length})`);
      return true;
    } catch (err) {
      console.error(`[cu-visuals] ✗ ${packId}:`, err);
      if (window.toastr) toastr.error(`Не удалось загрузить пак "${packId}"`, "✦ cu-visuals");
      return false;
    }
  }

  // ─── Pack registry ────────────────────────────────────────────

  const PACKS = [
    { id: "think-hider",  icon: "🧠", label: "think hider",      desc: "Скрывает &lt;think&gt;…&lt;/think&gt; из чата" },
    { id: "scene-sep",    icon: "✦",  label: "scene separator",  desc: "Заменяет горизонтальный разделитель на ✦" },
    { id: "time-display", icon: "🕰️", label: "time display",     desc: "[TIME]…[/TIME] — шапка с датой и локацией" },
    { id: "letter",       icon: "✉️", label: "letter",           desc: "[LETTER from=\"…\"]…[/LETTER] — письмо" },
    { id: "phone",        icon: "📱", label: "phone messages",   desc: "[PHONE from=\"…\"]…[/PHONE] — экран телефона" },
    { id: "receipt",      icon: "🧾", label: "receipt",          desc: "[RECEIPT]…[/RECEIPT] — кассовый чек" },
    { id: "ticket",       icon: "🎫", label: "ticket",           desc: "[TICKET]…[/TICKET] — билет" },
    { id: "newspaper",    icon: "📰", label: "newspaper",        desc: "[NEWSPAPER headline=\"…\"]…[/NEWSPAPER]" },
    { id: "diary",        icon: "📓", label: "diary",            desc: "[DIARY date=\"…\"]…[/DIARY] — дневник" },
    { id: "wanted",       icon: "🔴", label: "wanted poster",    desc: "[WANTED name=\"…\" reward=\"…\"]…[/WANTED]" },
    { id: "medical",      icon: "🏥", label: "medical document", desc: "[MEDICAL type=\"…\" patient=\"…\"]…[/MEDICAL]" },
    { id: "menu",         icon: "🍽️", label: "menu",             desc: "[MENU place=\"…\"]…[/MENU] — меню заведения" },
    { id: "quotes",       icon: "«»", label: "quotes & thoughts",desc: "Оформление «ёлочек» и *мыслей*" },
  ];

  // ─── Post-processors (DOM) ────────────────────────────────────

  function attr(el, name) {
    return decodeURIComponent(
      el.dataset[name] || el.getAttribute(`data-${name}`) || ""
    );
  }

  function parseLines(raw) {
    return raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  }

  function kvParse(lines) {
    const map = {};
    const items = [];
    for (const line of lines) {
      if (line.startsWith("-")) { items.push(line.slice(1).trim()); continue; }
      const m = line.match(/^([^:]+):\s*(.+)$/);
      if (m) map[m[1].trim().toLowerCase()] = m[2].trim();
    }
    return { map, items };
  }

  function parseReceipts() {
    document.querySelectorAll(".cu-receipt[data-raw]").forEach(el => {
      const raw = attr(el, "raw");
      el.removeAttribute("data-raw");
      if (!raw.trim()) return;

      const { map, items } = kvParse(parseLines(raw));
      const store    = map["store"] || map["магазин"] || map["заведение"] || "";
      const date     = map["date"]  || map["дата"] || "";
      const total    = map["total"] || map["итого"] || "";
      const paid     = map["paid"]  || map["оплата"] || map["оплачено"] || "";
      const discount = map["discount"] || map["скидка"] || "";

      const rows = items.map(item => {
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
        ${total ? `<div class="cu-receipt-total-row"><span>итого</span><span>${total}</span></div>` : ""}
        ${paid  ? `<div class="cu-receipt-paid">${paid}</div>` : ""}
        <div class="cu-receipt-thanks">спасибо за покупку</div>`;
    });
  }

  function parseTickets() {
    document.querySelectorAll(".cu-ticket[data-raw]").forEach(el => {
      const raw = attr(el, "raw");
      el.removeAttribute("data-raw");
      if (!raw.trim()) return;

      const { map } = kvParse(parseLines(raw));
      const type      = map["type"] || map["тип"] || map["вид"] || "";
      const from      = map["from"] || map["откуда"] || map["из"] || "";
      const to        = map["to"]   || map["куда"] || map["до"] || "";
      const date      = map["date"] || map["дата"] || "";
      const time      = map["time"] || map["время"] || map["отправление"] || "";
      const seat      = map["seat"] || map["место"] || map["вагон"] || map["ряд"] || "";
      const passenger = map["passenger"] || map["пассажир"] || map["имя"] || "";

      const ICONS = { поезд: "🚂", самолёт: "✈️", автобус: "🚌", концерт: "🎵", театр: "🎭", метро: "🚇" };
      const icon = Object.entries(ICONS).find(([k]) => type.toLowerCase().includes(k))?.[1] ?? "🎫";

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

  function parseMenus() {
    document.querySelectorAll(".cu-menu[data-raw]").forEach(el => {
      const place = attr(el, "place");
      const raw   = attr(el, "raw");
      el.removeAttribute("data-raw");
      el.removeAttribute("data-place");
      if (!raw.trim()) return;

      let html = "";
      for (const line of parseLines(raw)) {
        if (line.startsWith("#")) {
          html += `<div class="cu-menu-section">${line.replace(/^#+\s*/, "")}</div>`;
        } else if (line.startsWith("-")) {
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

  function runPostProcessors() {
    parseReceipts();
    parseTickets();
    parseMenus();
  }

  // ─── UI ───────────────────────────────────────────────────────

  function buildUI() {
    const container = document.getElementById("cu-visuals-packs");
    if (!container) return;

    const s = getExtSettings();

    container.innerHTML = PACKS.map(p => {
      const on = s.enabled.includes(p.id);
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

    container.querySelectorAll("input[data-pack]").forEach(cb => {
      cb.addEventListener("change", async e => {
        const id = e.target.dataset.pack;
        const s  = getExtSettings();
        if (e.target.checked) {
          if (!s.enabled.includes(id)) s.enabled.push(id);
          const ok = await injectPack(id);
          if (!ok) {
            e.target.checked = false;
            s.enabled = s.enabled.filter(x => x !== id);
            document.querySelector(`.cu-pack-row[data-pack="${id}"]`)?.classList.remove("cu-on");
          } else {
            document.querySelector(`.cu-pack-row[data-pack="${id}"]`)?.classList.add("cu-on");
          }
        } else {
          s.enabled = s.enabled.filter(x => x !== id);
          removePack(id);
          document.querySelector(`.cu-pack-row[data-pack="${id}"]`)?.classList.remove("cu-on");
        }
        save();
      });
    });
  }

  // ─── Init ─────────────────────────────────────────────────────

  jQuery(async () => {
    const s = getExtSettings();

    // Re-inject saved packs
    for (const id of [...s.enabled]) {
      await injectPack(id);
    }

    // Mount panel — ST may auto-load settings.html; if not, mount manually
    // Detect if already mounted to avoid duplicate
    if (!document.getElementById("cu-visuals-settings")) {
      try {
        const html = await $.get(`/${EXT_FOLDER}/settings.html`);
        $("#extensions_settings").append(html);
      } catch (e) {
        console.warn("[cu-visuals] settings.html load failed:", e);
      }
    }

    buildUI();

    // Post-processors on new messages
    const es = window.eventSource;
    const et = window.event_types;
    if (es && et) {
      es.on(et.CHARACTER_MESSAGE_RENDERED, runPostProcessors);
      es.on(et.USER_MESSAGE_RENDERED, runPostProcessors);
    } else {
      // Fallback: MutationObserver on chat container
      const chat = document.getElementById("chat");
      if (chat) {
        new MutationObserver(runPostProcessors).observe(chat, { childList: true, subtree: true });
      }
    }

    setTimeout(runPostProcessors, 600);
    console.log("[cu-visuals] ✓ ready. enabled:", s.enabled);
  });

})();
