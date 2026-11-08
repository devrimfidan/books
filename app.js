/* My Library / Kitaplığım — a static PWA over data/books.json (exported from the Obsidian vault) */
(() => {
  "use strict";

  /* ---------- i18n ---------- */
  const I18N = {
    en: {
      locale: "en-GB",
      appName: "My Library",
      titles: { shelves: "My Shelves", search: "Search", stats: "Stats" },
      tabs: { shelves: "Shelves", search: "Search", stats: "Stats" },
      status: { "Read": "Read", "Reading": "Currently reading", "To Read": "Want to read", "Backlog": "Owned", "Did Not Finish": "Did not finish" },
      lang: { English: "English", Turkish: "Turkish" },
      depth: { "Deep reads": "Deep", "Medium reads": "Medium", "Skim reads": "Skim" },
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      sub: (n, r) => `${n} books · ${r} read`,
      updated: (d) => `Last updated ${d}`,
      readingNow: "Currently reading",
      pages: (n) => `${n} pages`,
      books: (n) => `${n} ${n === 1 ? "book" : "books"}`,
      undated: "Undated",
      noTopic: "No topic",
      emptyShelf: "No books on this shelf.",
      emptySearch: "No matching books.",
      loadError: "Couldn't load the library. Check your connection and try again.",
      sort: { dateRead: "Date read", added: "Date added", title: "Title", author: "Author", rating: "My rating", year: "Publication year", topic: "Topic" },
      sortLabel: "Sort", layoutGrid: "Covers", layoutList: "List", layoutLabel: "Layout", shelvesLabel: "Shelves",
      searchPh: "Search title or author",
      all: { status: "All shelves", topic: "All topics", format: "All formats", lang: "All languages" },
      kpi: { read: "books read", pages: "pages read", year: (y) => `read in ${y}`, avg: (n) => `average rating (${n} books)` },
      perYear: "Books read per year",
      noDate: (n) => `${n} read ${n === 1 ? "book has" : "books have"} no date.`,
      topics: "Topics I've read", authors: "Most-read authors", library: "Library",
      formats: "Formats", formatsNote: "A book can be in more than one format.",
      language: "Language",
      facts: { read: "Read", year: "Published", pages: "Pages", lang: "Language", depth: "Reading", isbn: "ISBN" },
      format: "Format", topicsH: "Topics", goodreads: "Open on Goodreads",
      stars: (n) => `${n} of 5 stars`, close: "Close", switchTo: "Türkçe", switchShort: "TR",
    },
    tr: {
      locale: "tr-TR",
      appName: "Kitaplığım",
      titles: { shelves: "Raflarım", search: "Ara", stats: "İstatistik" },
      tabs: { shelves: "Raflar", search: "Ara", stats: "İstatistik" },
      status: { "Read": "Okundu", "Reading": "Okuyorum", "To Read": "Okunacak", "Backlog": "Kitaplıkta", "Did Not Finish": "Yarım kaldı" },
      lang: { English: "İngilizce", Turkish: "Türkçe" },
      depth: { "Deep reads": "Derin", "Medium reads": "Orta", "Skim reads": "Göz atma" },
      months: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
      sub: (n, r) => `${n} kitap · ${r} okundu`,
      updated: (d) => `Son güncelleme: ${d}`,
      readingNow: "Şu an okuyorum",
      pages: (n) => `${n} sayfa`,
      books: (n) => `${n} kitap`,
      undated: "Tarihsiz",
      noTopic: "Konusuz",
      emptyShelf: "Bu rafta kitap yok.",
      emptySearch: "Eşleşen kitap bulunamadı.",
      loadError: "Kitaplık yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.",
      sort: { dateRead: "Okunma tarihi", added: "Eklenme tarihi", title: "Başlık", author: "Yazar", rating: "Puanım", year: "Yayın yılı", topic: "Konu" },
      sortLabel: "Sırala", layoutGrid: "Kapaklar", layoutList: "Liste", layoutLabel: "Görünüm", shelvesLabel: "Raflar",
      searchPh: "Başlık veya yazar ara",
      all: { status: "Tüm raflar", topic: "Tüm konular", format: "Tüm formatlar", lang: "Tüm diller" },
      kpi: { read: "okunan kitap", pages: "okunan sayfa", year: (y) => `${y}'de okunan`, avg: (n) => `ortalama puan (${n} kitap)` },
      perYear: "Yıllara göre okunan",
      noDate: (n) => `${n} kitabın okunma tarihi yok.`,
      topics: "Okuduğum konular", authors: "En çok okuduğum yazarlar", library: "Kitaplık",
      formats: "Formatlar", formatsNote: "Bir kitap birden çok formatta olabilir.",
      language: "Dil",
      facts: { read: "Okundu", year: "Yayın", pages: "Sayfa", lang: "Dil", depth: "Okuma", isbn: "ISBN" },
      format: "Format", topicsH: "Konular", goodreads: "Goodreads'te aç",
      stars: (n) => `${n} / 5 yıldız`, close: "Kapat", switchTo: "English", switchShort: "EN",
    },
  };

  const SHELVES = ["Read", "To Read", "Backlog", "Did Not Finish"];
  const COLORS = ["#7A4B2A", "#2F5D50", "#6B3A4A", "#3D4F7A", "#8A6A2E", "#4E6B3A", "#5B4A7A", "#7A3B2E", "#2E5A6B", "#6B5A3A", "#44505C", "#8A4E3B"];
  const collator = new Intl.Collator("tr", { sensitivity: "base", numeric: true });

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  };
  const norm = (s) => String(s || "").toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");

  const state = Object.assign(
    { tab: "shelves", shelf: "Read", sort: {}, layout: "grid", uiLang: "en", q: "", status: "", topic: "", format: "", lang: "", shelfFormat: "" },
    store.get("kitapligim:ui", {})
  );
  if (!(state.uiLang in I18N)) state.uiLang = "en";
  const save = () => store.set("kitapligim:ui", { tab: state.tab, shelf: state.shelf, sort: state.sort, layout: state.layout, uiLang: state.uiLang });
  let L = I18N[state.uiLang];

  let BOOKS = [];
  let BY_ID = new Map();
  let GENERATED = "";

  /* ---------- helpers ---------- */
  function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.codePointAt(0)) | 0; return Math.abs(h); }
  const authors = (b) => b.authors.join(", ");
  const num = (n, opts) => Number(n).toLocaleString(L.locale, opts);
  function fmtDate(d) {
    if (!d) return "";
    const [y, m, day] = d.split("-").map(Number);
    if (!m) return String(y);
    return (day ? day + " " : "") + L.months[m - 1] + " " + y;
  }
  function stars(r, cls = "") {
    if (!r) return "";
    const n = Math.max(0, Math.min(5, Math.round(r)));
    const star = '<svg viewBox="0 0 24 24" class="X"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"/></svg>';
    let out = "";
    for (let i = 1; i <= 5; i++) out += star.replace("X", i <= n ? "on" : "");
    return `<span class="stars ${cls}" aria-label="${esc(L.stars(n))}">${out}</span>`;
  }
  function pill(status) {
    return `<span class="pill ${status === "Read" ? "read" : ""}">${esc(L.status[status] || status)}</span>`;
  }

  /* ---------- covers ---------- */
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
    return cached === 0 ? "" : null; // null = not looked up yet
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
  function olSearch(b, el) { olQueue.push([b, el]); pumpOL(); }
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
        .catch(() => { /* offline etc.: retry next time */ })
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

  /* ---------- templates ---------- */
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
    if (!list.length) return `<p class="empty">${esc(L.emptyShelf)}</p>`;
    return layout === "list"
      ? `<div class="list">${list.map((b) => row(b, opts)).join("")}</div>`
      : `<div class="grid">${list.map(tile).join("")}</div>`;
  }

  /* ---------- sorting ---------- */
  const SORTS = {
    dateRead: (a, b) => (b.dateRead || "").localeCompare(a.dateRead || "") || collator.compare(a.title, b.title),
    added: (a, b) => (b.added || "").localeCompare(a.added || "") || collator.compare(a.title, b.title),
    title: (a, b) => collator.compare(a.title, b.title),
    author: (a, b) => collator.compare(surname(a), surname(b)) || collator.compare(a.authors[0] || "~", b.authors[0] || "~") || collator.compare(a.title, b.title),
    rating: (a, b) => (b.rating || 0) - (a.rating || 0) || (b.dateRead || "").localeCompare(a.dateRead || ""),
    year: (a, b) => (b.year || -1e4) - (a.year || -1e4) || collator.compare(a.title, b.title),
    topic: (a, b) => collator.compare(a.title, b.title),
  };
  const READ_SHELVES = ["Read", "Did Not Finish"];
  const defaultSort = (shelf) => (READ_SHELVES.includes(shelf) ? "dateRead" : "added");
  // Date read and my rating only make sense for books I've read.
  const TOPIC_SHELVES = ["Read", "Backlog"];
  const sortsFor = (shelf) => Object.keys(SORTS).filter((k) => {
    if (k === "dateRead" || k === "rating") return READ_SHELVES.includes(shelf);
    if (k === "topic") return TOPIC_SHELVES.includes(shelf);
    return true;
  });
  function surname(b) {
    const a = (b.authors[0] || "").trim();
    return a ? a.split(/\s+/).pop() : "~";
  }
  function initial(b) {
    const s = surname(b);
    const c = s === "~" ? "" : s.charAt(0).toLocaleUpperCase("tr");
    return /\p{L}/u.test(c) ? c : "#";
  }
  // keyOf may return several keys: the book is then listed under each of them.
  function grouped(list, keyOf, order) {
    const groups = new Map();
    for (const b of list) {
      for (const k of [].concat(keyOf(b))) {
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(b);
      }
    }
    let entries = [...groups];
    if (order) entries = entries.sort(order);
    let html = "";
    for (const [k, items] of entries) {
      html += `<div class="group-h"><h2>${esc(k)}</h2><span>${esc(L.books(items.length))}</span></div>` + collection(items, state.layout);
    }
    return html;
  }

  /* ---------- Shelves ---------- */
  function renderShelves() {
    const reading = BOOKS.filter((b) => b.status === "Reading");
    $("#reading-now").innerHTML = reading.length
      ? `<div class="reading-now"><div class="section-label">${esc(L.readingNow)}</div><div class="reading-cards">${reading
          .map((b) => `<button type="button" class="reading-card" data-book="${esc(b.id)}">${coverHTML(b)}<div>
            <h3>${esc(b.title)}</h3><p>${esc(authors(b))}</p>
            <div class="meta">${[b.pages ? L.pages(b.pages) : "", b.formats.join(" · ")].filter(Boolean).map(esc).join(" · ")}</div></div></button>`)
          .join("")}</div></div>`
      : "";

    const counts = {};
    BOOKS.forEach((b) => (counts[b.status] = (counts[b.status] || 0) + 1));
    $("#shelf-chips").innerHTML = SHELVES.filter((s) => counts[s])
      .map((s) => `<button type="button" class="chip ${s === state.shelf ? "active" : ""}" data-shelf="${s}">${esc(L.status[s])} <b>${counts[s]}</b></button>`)
      .join("");

    const allowed = sortsFor(state.shelf);
    const sortKey = allowed.includes(state.sort[state.shelf]) ? state.sort[state.shelf] : defaultSort(state.shelf);
    $$("#shelf-sort option").forEach((o) => (o.hidden = o.disabled = !allowed.includes(o.value)));
    $("#shelf-sort").value = sortKey;

    // Owned shelf: extra format filter
    const onShelf = BOOKS.filter((b) => b.status === state.shelf);
    const showFormat = state.shelf === "Backlog";
    $("#shelf-format-wrap").hidden = !showFormat;
    if (showFormat) {
      const fmts = [...new Set(onShelf.flatMap((b) => b.formats))].sort(collator.compare);
      if (!fmts.includes(state.shelfFormat)) state.shelfFormat = "";
      fillSelect($("#shelf-format"), L.all.format, fmts, state.shelfFormat);
    }
    $$(".seg button").forEach((x) => x.classList.toggle("active", x.dataset.layout === state.layout));

    const list = onShelf.filter((b) => !showFormat || !state.shelfFormat || b.formats.includes(state.shelfFormat)).sort(SORTS[sortKey]);
    let html = "";
    if (sortKey === "dateRead") html = grouped(list, (b) => (b.dateRead ? b.dateRead.slice(0, 4) : L.undated));
    else if (sortKey === "author") html = grouped(list, initial);
    else if (sortKey === "year") html = grouped(list, (b) => (b.year ? String(b.year) : L.undated));
    else if (sortKey === "topic") {
      html = grouped(list, (b) => (b.topics.length ? b.topics : L.noTopic),
        ([a], [b]) => (a === L.noTopic) - (b === L.noTopic) || collator.compare(a, b));
    }
    else html = collection(list, state.layout);
    $("#shelf-body").innerHTML = html || collection([], state.layout);
    hydrateCovers($("#view-shelves"));
  }

  /* ---------- Search ---------- */
  function fillSelect(sel, label, values, current, labeler = (v) => v) {
    sel.innerHTML = `<option value="">${esc(label)}</option>` + values.map((v) => `<option value="${esc(v)}" ${v === current ? "selected" : ""}>${esc(labeler(v))}</option>`).join("");
  }
  function setupFilters() {
    const uniq = (arr) => [...new Set(arr)].sort(collator.compare);
    fillSelect($("#f-status"), L.all.status, ["Reading", ...SHELVES], state.status, (v) => L.status[v]);
    fillSelect($("#f-topic"), L.all.topic, uniq(BOOKS.flatMap((b) => b.topics)), state.topic);
    fillSelect($("#f-format"), L.all.format, uniq(BOOKS.flatMap((b) => b.formats)), state.format);
    fillSelect($("#f-lang"), L.all.lang, uniq(BOOKS.map((b) => b.language).filter(Boolean)), state.lang, (v) => L.lang[v] || v);
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
    $("#search-count").textContent = L.books(list.length);
    $("#search-body").innerHTML = list.length ? collection(list, "list", { showStatus: true }) : `<p class="empty">${esc(L.emptySearch)}</p>`;
    hydrateCovers($("#search-body"));
  }

  /* ---------- Stats ---------- */
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

    $("#stats-body").innerHTML = `
      <div class="kpis">
        <div class="kpi"><div class="v">${num(read.length)}</div><div class="l">${esc(L.kpi.read)}</div></div>
        <div class="kpi"><div class="v">${num(pages)}</div><div class="l">${esc(L.kpi.pages)}</div></div>
        <div class="kpi"><div class="v">${num(readThisYear)}</div><div class="l">${esc(L.kpi.year(thisYear))}</div></div>
        <div class="kpi"><div class="v">${avg ? num(avg, { maximumFractionDigits: 1 }) : "–"}</div><div class="l">${esc(L.kpi.avg(rated.length))}</div></div>
      </div>
      ${yearsHTML ? `<div class="card"><h2>${esc(L.perYear)}</h2>${undated ? `<p class="note">${esc(L.noDate(undated))}</p>` : ""}<div class="years">${yearsHTML}</div></div>` : ""}
      ${topics.length ? `<div class="card"><h2>${esc(L.topics)}</h2>${bars(topics, topics[0][1], "topic")}</div>` : ""}
      ${authorsTop.length ? `<div class="card"><h2>${esc(L.authors)}</h2>${bars(authorsTop, authorsTop[0][1], "author")}</div>` : ""}
      <div class="card"><h2>${esc(L.library)}</h2>
        ${bars(SHELVES.concat("Reading").map((s) => [L.status[s], BOOKS.filter((b) => b.status === s).length]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]), total)}
      </div>
      <div class="card"><h2>${esc(L.formats)}</h2><p class="note">${esc(L.formatsNote)}</p>${bars(formats, formats[0] ? formats[0][1] : 1, "format")}</div>
      ${langs.length ? `<div class="card"><h2>${esc(L.language)}</h2>
        <div class="split">${langs.map(([, n]) => `<i style="width:${(n / total) * 100}%"></i>`).join("")}</div>
        <div class="legend">${langs.map(([k, n], i) => `<span><b style="background:${i ? "var(--star)" : "var(--accent)"}"></b>${esc(L.lang[k] || k)} ${n}</span>`).join("")}</div></div>` : ""}
    `;
    hydrateCovers($("#stats-body"));
  }

  /* ---------- Detail ---------- */
  let openId = null;
  function openBook(id) {
    const b = BY_ID.get(id);
    if (!b) return;
    openId = id;
    const facts = [
      [L.facts.read, b.status === "Read" || b.status === "Did Not Finish" ? fmtDate(b.dateRead) : ""],
      [L.facts.year, b.year],
      [L.facts.pages, b.pages],
      [L.facts.lang, L.lang[b.language] || b.language],
      [L.facts.depth, L.depth[b.depth] || b.depth],
      [L.facts.isbn, b.isbn13 || b.isbn],
    ].filter(([, v]) => v);
    $("#sheet-body").innerHTML = `<div class="detail">
      <div class="detail-top">
        ${coverHTML(b)}
        <h2 id="sheet-title">${esc(b.title)}</h2>
        <div class="by">${b.authors.map((a) => `<a href="#" data-author="${esc(a)}">${esc(a)}</a>`).join(", ")}</div>
        ${stars(b.rating, "lg")}
        <div class="status">${pill(b.status)}</div>
      </div>
      ${facts.length ? `<dl class="facts">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
      ${b.formats.length ? `<h4>${esc(L.format)}</h4><div class="tags">${b.formats.map((f) => `<button type="button" class="chip" data-filter="format" data-value="${esc(f)}">${esc(f)}</button>`).join("")}</div>` : ""}
      ${b.topics.length ? `<h4>${esc(L.topicsH)}</h4><div class="tags">${b.topics.map((t) => `<button type="button" class="chip" data-filter="topic" data-value="${esc(t)}">${esc(t)}</button>`).join("")}</div>` : ""}
      ${b.goodreads ? `<a class="btn" href="${esc(b.goodreads)}" target="_blank" rel="noopener">${esc(L.goodreads)}</a>` : ""}
    </div>`;
    const el = $("#sheet");
    const wasOpen = !el.hidden;
    el.hidden = false;
    document.body.classList.add("sheet-open");
    if (!wasOpen) $(".sheet-panel").scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("open")));
    $$(".cover[data-cover]", el).forEach(loadCover);
  }
  function closeSheet() {
    const el = $("#sheet");
    openId = null;
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

  /* ---------- static text + language ---------- */
  function applyStaticText() {
    document.documentElement.lang = state.uiLang;
    document.title = L.appName;
    $$("[data-i18n-tab]").forEach((el) => (el.textContent = L.tabs[el.dataset.i18nTab]));
    $$("#shelf-sort option").forEach((o) => (o.textContent = L.sort[o.value]));
    $("#q").placeholder = L.searchPh;
    $("#shelf-chips").setAttribute("aria-label", L.shelvesLabel);
    $(".seg").setAttribute("aria-label", L.layoutLabel);
    $('[data-layout="grid"]').setAttribute("aria-label", L.layoutGrid);
    $('[data-layout="list"]').setAttribute("aria-label", L.layoutList);
    $$("[data-close]").forEach((el) => el.matches("button") && el.setAttribute("aria-label", L.close));
    const t = $("#lang-toggle");
    t.textContent = L.switchShort;
    t.setAttribute("aria-label", L.switchTo);
    t.title = L.switchTo;
  }
  function setLang(lang) {
    state.uiLang = lang;
    L = I18N[lang];
    save();
    applyStaticText();
    if (BOOKS.length) {
      setupFilters();
      showTab(state.tab, { keepScroll: true });
      if (openId) openBook(openId);
    }
  }

  /* ---------- tabs ---------- */
  function showTab(tab, opts = {}) {
    state.tab = tab;
    save();
    $$(".view").forEach((v) => (v.hidden = v.dataset.view !== tab));
    $$(".tabbar button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    $("#view-title").textContent = L.titles[tab];
    const read = BOOKS.filter((b) => b.status === "Read").length;
    $("#view-sub").textContent = tab === "stats" && GENERATED ? L.updated(fmtDate(GENERATED)) : L.sub(num(BOOKS.length), num(read));
    if (tab === "shelves") renderShelves();
    if (tab === "search") renderSearch();
    if (tab === "stats") renderStats();
    if (!opts.keepScroll) window.scrollTo(0, 0);
  }
  function goSearch(filters) {
    Object.assign(state, { q: "", status: "", topic: "", format: "", lang: "" }, filters);
    $("#q").value = state.q;
    setupFilters();
    showTab("search");
  }

  /* ---------- events ---------- */
  document.addEventListener("click", (e) => {
    if (e.target.closest("#lang-toggle")) return setLang(state.uiLang === "en" ? "tr" : "en");
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
  $("#shelf-format").addEventListener("change", (e) => { state.shelfFormat = e.target.value; renderShelves(); });
  let qTimer;
  $("#q").addEventListener("input", (e) => { clearTimeout(qTimer); qTimer = setTimeout(() => { state.q = e.target.value; renderSearch(); }, 120); });
  [["#f-status", "status"], ["#f-topic", "topic"], ["#f-format", "format"], ["#f-lang", "lang"]].forEach(([sel, key]) =>
    $(sel).addEventListener("change", (e) => { state[key] = e.target.value; renderSearch(); })
  );
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") dismissSheet(); });
  window.addEventListener("hashchange", route);
  window.addEventListener("scroll", () => $(".topbar").classList.toggle("scrolled", window.scrollY > 4), { passive: true });

  // Swipe the sheet down to close
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

  /* ---------- start ---------- */
  applyStaticText();
  fetch("data/books.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then((data) => {
      GENERATED = data.generated || "";
      BOOKS = data.books || [];
      BY_ID = new Map(BOOKS.map((b) => [b.id, b]));
      if (!BOOKS.some((b) => b.status === state.shelf)) state.shelf = "Read";
      setupFilters();
      showTab(state.tab in L.titles ? state.tab : "shelves");
      route();
    })
    .catch(() => {
      $("#shelf-body").innerHTML = `<p class="empty">${esc(L.loadError)}</p>`;
    });

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
