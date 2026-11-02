/* Kitaplığım — vault'tan üretilen data/books.json'u gösteren statik PWA */
(() => {
  "use strict";

  const STATUS = {
    "Read": "Okundu",
    "Reading": "Okuyorum",
    "To Read": "Okunacak",
    "Backlog": "Kitaplıkta",
    "Did Not Finish": "Yarım kaldı",
  };
  const SHELVES = ["Read", "To Read", "Backlog", "Did Not Finish"];
  const LANG = { English: "İngilizce", Turkish: "Türkçe" };
  const DEPTH = { "Deep reads": "Derin", "Medium reads": "Orta", "Skim reads": "Göz atma" };
  const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const COLORS = ["#7A4B2A", "#2F5D50", "#6B3A4A", "#3D4F7A", "#8A6A2E", "#4E6B3A", "#5B4A7A", "#7A3B2E", "#2E5A6B", "#6B5A3A", "#44505C", "#8A4E3B"];
  const collator = new Intl.Collator("tr", { sensitivity: "base", numeric: true });

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* yok say */ } },
  };
  const norm = (s) => String(s || "").toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");

  const state = Object.assign(
    { tab: "shelves", shelf: "Read", sort: {}, layout: "grid", q: "", status: "", topic: "", format: "", lang: "" },
    store.get("kitapligim:ui", {})
  );
  const save = () => store.set("kitapligim:ui", { tab: state.tab, shelf: state.shelf, sort: state.sort, layout: state.layout });

  let BOOKS = [];
  let BY_ID = new Map();
  let GENERATED = "";

  /* ---------- yardımcılar ---------- */
  function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.codePointAt(0)) | 0; return Math.abs(h); }
  const authors = (b) => b.authors.join(", ");
  function fmtDate(d) {
    if (!d) return "";
    const [y, m, day] = d.split("-").map(Number);
    if (!m) return String(y);
    return (day ? day + " " : "") + MONTHS[m - 1] + " " + y;
  }
  function stars(r, cls = "") {
    if (!r) return "";
    const n = Math.max(0, Math.min(5, Math.round(r)));
    const star = '<svg viewBox="0 0 24 24" class="X"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"/></svg>';
    let out = "";
    for (let i = 1; i <= 5; i++) out += star.replace("X", i <= n ? "on" : "");
    return `<span class="stars ${cls}" aria-label="${n} / 5 yıldız">${out}</span>`;
  }
  function pill(status) {
    return `<span class="pill ${status === "Read" ? "read" : ""}">${esc(STATUS[status] || status)}</span>`;
  }

  /* ---------- kapaklar ---------- */
  const OL_KEY = "kitapligim:ol:";
  const olQueue = [];
  let olActive = 0;
  function coverHTML(b) {
    const c = COLORS[hash(b.title + authors(b)) % COLORS.length];
    return `<div class="cover" style="--c:${c}" data-cover="${esc(b.id)}">
      <div class="gen"><div class="gt">${esc(b.title)}</div><div class="ga">${esc(authors(b))}</div></div></div>`;
  }
  function directCover(b) {
    if (b.cover) return b.cover;
    const isbn = b.isbn13 || b.isbn;
    if (isbn) return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`;
    const cached = store.get(OL_KEY + b.id, null);
    if (cached) return `https://covers.openlibrary.org/b/id/${cached}-M.jpg`;
    return cached === 0 ? "" : null; // null = henüz aranmadı
  }
  function setImg(el, url) {
    if (!url || el.querySelector("img")) return;
    const img = new Image();
    img.alt = "";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    img.onload = () => { if (img.naturalWidth > 2) img.classList.add("ok"); else img.remove(); };
    img.onerror = () => img.remove();
    img.src = url;
    el.appendChild(img);
  }
  function olSearch(b, el) {
    olQueue.push([b, el]);
    pumpOL();
  }
  function pumpOL() {
    while (olActive < 3 && olQueue.length) {
      const [b, el] = olQueue.shift();
      if (store.get(OL_KEY + b.id, null) !== null) { setImg(el, directCover(b)); continue; }
      olActive++;
      const title = b.title.split(/ - |: /)[0];
      const params = new URLSearchParams({ title, limit: "1", fields: "cover_i" });
      if (b.authors[0]) params.set("author", b.authors[0]);
      fetch("https://openlibrary.org/search.json?" + params)
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((j) => {
          const id = j.docs && j.docs[0] && j.docs[0].cover_i;
          store.set(OL_KEY + b.id, id || 0);
          if (id) setImg(el, `https://covers.openlibrary.org/b/id/${id}-M.jpg`);
        })
        .catch(() => { /* çevrimdışı vb.: bir dahaki sefere tekrar dene */ })
        .finally(() => { olActive--; pumpOL(); });
    }
  }
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          loadCover(e.target);
        }
      }, { rootMargin: "300px 0px" })
    : null;
  function loadCover(el) {
    const b = BY_ID.get(el.dataset.cover);
    if (!b) return;
    const url = directCover(b);
    if (url === null) olSearch(b, el); else setImg(el, url);
  }
  function hydrateCovers(root) {
    $$(".cover[data-cover]", root).forEach((el) => (io ? io.observe(el) : loadCover(el)));
  }

  /* ---------- kart şablonları ---------- */
  function tile(b) {
    return `<button type="button" class="tile" data-book="${esc(b.id)}">
      ${coverHTML(b)}
      <span class="t">${esc(b.title)}</span>
      <span class="a">${esc(authors(b))}</span>
      ${b.status === "Read" ? stars(b.rating) : ""}
    </button>`;
  }
  function row(b, opts = {}) {
    const bits = [];
    if (opts.showStatus) bits.push(pill(b.status));
    if (b.rating) bits.push(stars(b.rating));
    if (b.status === "Read" && b.dateRead) bits.push(esc(fmtDate(b.dateRead)));
    if (b.year) bits.push(esc(b.year));
    if (b.formats.length) bits.push(esc(b.formats.join(" · ")));
    return `<button type="button" class="row" data-book="${esc(b.id)}">
      ${coverHTML(b)}
      <div><h3>${esc(b.title)}</h3><div class="by">${esc(authors(b))}</div>
      <div class="line">${bits.map((x) => `<span>${x}</span>`).join("")}</div></div>
    </button>`;
  }
  function collection(list, layout, opts) {
    if (!list.length) return `<p class="empty">Bu rafta kitap yok.</p>`;
    return layout === "list"
      ? `<div class="list">${list.map((b) => row(b, opts)).join("")}</div>`
      : `<div class="grid">${list.map(tile).join("")}</div>`;
  }

  /* ---------- sıralama ---------- */
  const SORTS = {
    dateRead: (a, b) => (b.dateRead || "").localeCompare(a.dateRead || "") || collator.compare(a.title, b.title),
    added: (a, b) => (b.added || "").localeCompare(a.added || "") || collator.compare(a.title, b.title),
    title: (a, b) => collator.compare(a.title, b.title),
    author: (a, b) => collator.compare(a.authors[0] || "~", b.authors[0] || "~") || collator.compare(a.title, b.title),
    rating: (a, b) => (b.rating || 0) - (a.rating || 0) || (b.dateRead || "").localeCompare(a.dateRead || ""),
    year: (a, b) => (b.year || -1e4) - (a.year || -1e4) || collator.compare(a.title, b.title),
  };
  const defaultSort = (shelf) => (shelf === "Read" || shelf === "Did Not Finish" ? "dateRead" : "added");

  /* ---------- Raflar ---------- */
  function renderShelves() {
    const reading = BOOKS.filter((b) => b.status === "Reading");
    $("#reading-now").innerHTML = reading.length
      ? `<div class="reading-now"><div class="section-label">Şu an okuyorum</div><div class="reading-cards">${reading
          .map((b) => `<button type="button" class="reading-card" data-book="${esc(b.id)}">${coverHTML(b)}<div>
            <h3>${esc(b.title)}</h3><p>${esc(authors(b))}</p>
            <div class="meta">${[b.pages ? b.pages + " sayfa" : "", b.formats.join(" · ")].filter(Boolean).map(esc).join(" · ")}</div></div></button>`)
          .join("")}</div></div>`
      : "";

    const counts = {};
    BOOKS.forEach((b) => (counts[b.status] = (counts[b.status] || 0) + 1));
    $("#shelf-chips").innerHTML = SHELVES.filter((s) => counts[s])
      .map((s) => `<button type="button" class="chip ${s === state.shelf ? "active" : ""}" data-shelf="${s}">${STATUS[s]} <b>${counts[s]}</b></button>`)
      .join("");

    const sortKey = state.sort[state.shelf] || defaultSort(state.shelf);
    $("#shelf-sort").value = sortKey;
    $$(".seg button").forEach((x) => x.classList.toggle("active", x.dataset.layout === state.layout));

    const list = BOOKS.filter((b) => b.status === state.shelf).sort(SORTS[sortKey]);
    let html = "";
    if (sortKey === "dateRead") {
      const groups = new Map();
      for (const b of list) {
        const k = b.dateRead ? b.dateRead.slice(0, 4) : "Tarihsiz";
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(b);
      }
      for (const [k, items] of groups) {
        html += `<div class="group-h"><h2>${esc(k)}</h2><span>${items.length} kitap</span></div>` + collection(items, state.layout);
      }
    } else {
      html = collection(list, state.layout);
    }
    const body = $("#shelf-body");
    body.innerHTML = html || collection([], state.layout);
    hydrateCovers($("#view-shelves"));
  }

  /* ---------- Ara ---------- */
  function fillSelect(sel, label, values, current, labeler = (v) => v) {
    sel.innerHTML = `<option value="">${label}</option>` + values.map((v) => `<option value="${esc(v)}" ${v === current ? "selected" : ""}>${esc(labeler(v))}</option>`).join("");
  }
  function setupFilters() {
    const uniq = (arr) => [...new Set(arr)].sort(collator.compare);
    fillSelect($("#f-status"), "Tüm raflar", ["Reading", ...SHELVES], state.status, (v) => STATUS[v]);
    fillSelect($("#f-topic"), "Tüm konular", uniq(BOOKS.flatMap((b) => b.topics)), state.topic);
    fillSelect($("#f-format"), "Tüm formatlar", uniq(BOOKS.flatMap((b) => b.formats)), state.format);
    fillSelect($("#f-lang"), "Tüm diller", uniq(BOOKS.map((b) => b.language).filter(Boolean)), state.lang, (v) => LANG[v] || v);
  }
  function renderSearch() {
    const q = norm(state.q.trim());
    const terms = q.split(/\s+/).filter(Boolean);
    const list = BOOKS.filter((b) => {
      if (state.status && b.status !== state.status) return false;
      if (state.topic && !b.topics.includes(state.topic)) return false;
      if (state.format && !b.formats.includes(state.format)) return false;
      if (state.lang && b.language !== state.lang) return false;
      if (!terms.length) return true;
      const hay = b._hay || (b._hay = norm(b.title + " " + authors(b)));
      return terms.every((t) => hay.includes(t));
    }).sort(SORTS.title);
    $("#search-count").textContent = `${list.length} kitap`;
    $("#search-body").innerHTML = list.length ? collection(list, "list", { showStatus: true }) : `<p class="empty">Eşleşen kitap bulunamadı.</p>`;
    hydrateCovers($("#search-body"));
  }

  /* ---------- İstatistik ---------- */
  function bars(entries, max, filterKey) {
    return `<div class="bars">${entries
      .map(([k, n]) => `<button type="button" class="bar" ${filterKey ? `data-filter="${filterKey}" data-value="${esc(k)}"` : ""}>
        <span class="k">${esc(k)}</span><span class="track"><span class="fill" style="width:${(n / max) * 100}%"></span></span><span class="n">${n}</span></button>`)
      .join("")}</div>`;
  }
  function countBy(list, fn) {
    const m = new Map();
    list.forEach((b) => [].concat(fn(b)).filter(Boolean).forEach((k) => m.set(k, (m.get(k) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1] || collator.compare(a[0], b[0]));
  }
  function renderStats() {
    const read = BOOKS.filter((b) => b.status === "Read");
    const pages = read.reduce((s, b) => s + (b.pages || 0), 0);
    const rated = read.filter((b) => b.rating);
    const avg = rated.length ? rated.reduce((s, b) => s + Math.min(5, b.rating), 0) / rated.length : 0;
    const thisYear = String(new Date().getFullYear());
    const readThisYear = read.filter((b) => (b.dateRead || "").startsWith(thisYear)).length;

    const yearMap = new Map();
    read.forEach((b) => { if (b.dateRead) { const y = +b.dateRead.slice(0, 4); yearMap.set(y, (yearMap.get(y) || 0) + 1); } });
    const ys = [...yearMap.keys()];
    let yearsHTML = "";
    if (ys.length) {
      const from = Math.max(Math.min(...ys), Math.max(...ys) - 14);
      const to = Math.max(...ys, +thisYear);
      const maxY = Math.max(...yearMap.values());
      for (let y = from; y <= to; y++) {
        const n = yearMap.get(y) || 0;
        yearsHTML += `<button type="button" class="y" data-year="${y}"><div class="col" style="height:${(n / maxY) * 100}%">${n ? `<span>${n}</span>` : ""}</div>${String(y).slice(2)}</button>`;
      }
    }
    const undated = read.filter((b) => !b.dateRead).length;
    const topics = countBy(read, (b) => b.topics).slice(0, 10);
    const authorsTop = countBy(read, (b) => b.authors).filter(([, n]) => n > 1).slice(0, 8);
    const formats = countBy(BOOKS, (b) => b.formats);
    const langs = countBy(BOOKS, (b) => b.language);
    const total = BOOKS.length;
    const longest = read.filter((b) => b.pages).sort((a, b) => b.pages - a.pages)[0];

    $("#stats-body").innerHTML = `
      <div class="kpis">
        <div class="kpi"><div class="v">${read.length}</div><div class="l">okunan kitap</div></div>
        <div class="kpi"><div class="v">${pages.toLocaleString("tr")}</div><div class="l">okunan sayfa</div></div>
        <div class="kpi"><div class="v">${readThisYear}</div><div class="l">${thisYear}'de okunan</div></div>
        <div class="kpi"><div class="v">${avg ? avg.toLocaleString("tr", { maximumFractionDigits: 1 }) : "–"}</div><div class="l">ortalama puan (${rated.length} kitap)</div></div>
      </div>
      ${yearsHTML ? `<div class="card"><h2>Yıllara göre okunan</h2>${undated ? `<p class="note">${undated} kitabın okunma tarihi yok.</p>` : ""}<div class="years">${yearsHTML}</div></div>` : ""}
      ${topics.length ? `<div class="card"><h2>Okuduğum konular</h2>${bars(topics, topics[0][1], "topic")}</div>` : ""}
      ${authorsTop.length ? `<div class="card"><h2>En çok okuduğum yazarlar</h2>${bars(authorsTop, authorsTop[0][1], "author")}</div>` : ""}
      <div class="card"><h2>Kitaplık</h2>
        ${bars(SHELVES.concat("Reading").map((s) => [STATUS[s], BOOKS.filter((b) => b.status === s).length]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]), total)}
      </div>
      <div class="card"><h2>Formatlar</h2><p class="note">Bir kitap birden çok formatta olabilir.</p>${bars(formats, formats[0] ? formats[0][1] : 1, "format")}</div>
      ${langs.length ? `<div class="card"><h2>Dil</h2>
        <div class="split">${langs.map(([, n]) => `<i style="width:${(n / total) * 100}%"></i>`).join("")}</div>
        <div class="legend">${langs.map(([k, n], i) => `<span><b style="background:${i ? "var(--star)" : "var(--accent)"}"></b>${esc(LANG[k] || k)} ${n}</span>`).join("")}</div></div>` : ""}
      ${longest ? `<div class="card"><h2>En uzun okuduğum</h2>${row(longest)}</div>` : ""}
    `;
    hydrateCovers($("#stats-body"));
  }

  /* ---------- Detay ---------- */
  function openBook(id) {
    const b = BY_ID.get(id);
    if (!b) return;
    const facts = [
      ["Okundu", b.status === "Read" || b.status === "Did Not Finish" ? fmtDate(b.dateRead) : ""],
      ["Yayın", b.year],
      ["Sayfa", b.pages],
      ["Dil", LANG[b.language] || b.language],
      ["Okuma", DEPTH[b.depth] || b.depth],
      ["ISBN", b.isbn13 || b.isbn],
    ].filter(([, v]) => v);
    $("#sheet-body").innerHTML = `<div class="detail">
      <div class="detail-top">
        ${coverHTML(b)}
        <h2 id="sheet-title">${esc(b.title)}</h2>
        <div class="by">${b.authors.map((a) => `<a href="#" data-author="${esc(a)}">${esc(a)}</a>`).join(", ")}</div>
        ${stars(b.rating, "lg")}
        <div class="status">${pill(b.status)}</div>
      </div>
      ${facts.length ? `<dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
      ${b.formats.length ? `<h4>Format</h4><div class="tags">${b.formats.map((f) => `<button type="button" class="chip" data-filter="format" data-value="${esc(f)}">${esc(f)}</button>`).join("")}</div>` : ""}
      ${b.topics.length ? `<h4>Konular</h4><div class="tags">${b.topics.map((t) => `<button type="button" class="chip" data-filter="topic" data-value="${esc(t)}">${esc(t)}</button>`).join("")}</div>` : ""}
      ${b.goodreads ? `<a class="btn" href="${esc(b.goodreads)}" target="_blank" rel="noopener">Goodreads'te aç</a>` : ""}
    </div>`;
    const el = $("#sheet");
    el.hidden = false;
    document.body.classList.add("sheet-open");
    $(".sheet-panel").scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("open")));
    $$(".cover[data-cover]", el).forEach(loadCover);
  }
  function closeSheet() {
    const el = $("#sheet");
    if (el.hidden) return;
    el.classList.remove("open");
    document.body.classList.remove("sheet-open");
    setTimeout(() => { if (!el.classList.contains("open")) el.hidden = true; }, 320);
  }
  function route() {
    const m = location.hash.match(/^#kitap\/(.+)$/);
    if (m) openBook(decodeURIComponent(m[1])); else closeSheet();
  }
  function dismissSheet() {
    if (/^#kitap\//.test(location.hash)) history.back(); else closeSheet();
  }

  /* ---------- sekmeler ---------- */
  const TITLES = { shelves: "Raflarım", search: "Ara", stats: "İstatistik" };
  function showTab(tab) {
    state.tab = tab;
    save();
    $$(".view").forEach((v) => (v.hidden = v.dataset.view !== tab));
    $$(".tabbar button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    $("#view-title").textContent = TITLES[tab];
    const read = BOOKS.filter((b) => b.status === "Read").length;
    $("#view-sub").textContent = tab === "stats" && GENERATED
      ? `Son güncelleme: ${fmtDate(GENERATED)}`
      : `${BOOKS.length} kitap · ${read} okundu`;
    if (tab === "shelves") renderShelves();
    if (tab === "search") renderSearch();
    if (tab === "stats") renderStats();
    window.scrollTo(0, 0);
  }
  function goSearch(filters) {
    Object.assign(state, { q: "", status: "", topic: "", format: "", lang: "" }, filters);
    $("#q").value = state.q;
    setupFilters();
    showTab("search");
  }

  /* ---------- olaylar ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-book],[data-shelf],[data-tab],[data-layout],[data-close],[data-filter],[data-author],[data-year]");
    if (!t) return;
    if (t.dataset.close !== undefined) return dismissSheet();
    if (t.dataset.book) { location.hash = "kitap/" + encodeURIComponent(t.dataset.book); return; }
    if (t.dataset.shelf) { state.shelf = t.dataset.shelf; save(); renderShelves(); return; }
    if (t.dataset.tab) { if (!$("#sheet").hidden) dismissSheet(); showTab(t.dataset.tab); return; }
    if (t.dataset.layout) { state.layout = t.dataset.layout; save(); renderShelves(); return; }
    const fromSheet = !!t.closest(".sheet");
    let filters = null;
    if (t.dataset.author) { e.preventDefault(); filters = { q: t.dataset.author }; }
    else if (t.dataset.filter === "author") filters = { q: t.dataset.value };
    else if (t.dataset.filter) filters = { [t.dataset.filter]: t.dataset.value, status: fromSheet ? "" : "Read" };
    else if (t.dataset.year) {
      state.shelf = "Read"; state.sort.Read = "dateRead"; save();
      showTab("shelves");
      requestAnimationFrame(() => {
        const h = $$(".group-h h2").find((x) => x.textContent === t.dataset.year);
        if (h) h.scrollIntoView({ block: "start" });
      });
      return;
    }
    if (filters) {
      if (fromSheet) dismissSheet();
      goSearch(filters);
    }
  });
  $("#shelf-sort").addEventListener("change", (e) => { state.sort[state.shelf] = e.target.value; save(); renderShelves(); });
  let qTimer;
  $("#q").addEventListener("input", (e) => { clearTimeout(qTimer); qTimer = setTimeout(() => { state.q = e.target.value; renderSearch(); }, 120); });
  [["#f-status", "status"], ["#f-topic", "topic"], ["#f-format", "format"], ["#f-lang", "lang"]].forEach(([sel, key]) =>
    $(sel).addEventListener("change", (e) => { state[key] = e.target.value; renderSearch(); })
  );
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") dismissSheet(); });
  window.addEventListener("hashchange", route);
  window.addEventListener("scroll", () => $(".topbar").classList.toggle("scrolled", window.scrollY > 4), { passive: true });

  // Paneli aşağı kaydırarak kapatma
  (() => {
    const panel = $(".sheet-panel");
    let y0 = null, dy = 0;
    panel.addEventListener("touchstart", (e) => { y0 = panel.scrollTop <= 0 ? e.touches[0].clientY : null; dy = 0; }, { passive: true });
    panel.addEventListener("touchmove", (e) => {
      if (y0 === null) return;
      dy = e.touches[0].clientY - y0;
      if (dy > 0) { panel.style.transition = "none"; panel.style.transform = `translateY(${dy}px)`; }
    }, { passive: true });
    panel.addEventListener("touchend", () => {
      panel.style.transition = ""; panel.style.transform = "";
      if (y0 !== null && dy > 110) dismissSheet();
      y0 = null;
    });
  })();

  /* ---------- başlat ---------- */
  fetch("data/books.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then((data) => {
      GENERATED = data.generated || "";
      BOOKS = data.books || [];
      BY_ID = new Map(BOOKS.map((b) => [b.id, b]));
      if (!BOOKS.some((b) => b.status === state.shelf)) state.shelf = "Read";
      setupFilters();
      showTab(state.tab in TITLES ? state.tab : "shelves");
      route();
    })
    .catch(() => {
      $("#shelf-body").innerHTML = `<p class="empty">Kitaplık yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.</p>`;
    });

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
