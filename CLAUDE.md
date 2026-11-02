# Kitaplığım (devrimfidan/books)

Obsidian vault'umdaki kitap notlarından üretilen, GitHub Pages'te yayınlanan kişisel kitaplık sitesi.
Canlı: https://devrimfidan.github.io/books/

## Temel kural: vault ana kaynaktır

- Ana kaynak Obsidian vault: `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Emin-Notes`
  Kitap notları `References/` altında.
- Kitap bilgisi her zaman önce vault'taki notta düzenlenir. `data/books.json` elle düzenlenmez;
  her zaman `python3 scripts/export_vault.py` ile vault'tan üretilir.
- Akış: (1) istenirse vault notunu düzenle → (2) ben söyleyince export betiğini çalıştır →
  (3) `data/books.json` farkını göster → (4) onayımla commit + push.

## Vault notları

- Bir not kitapsa frontmatter'daki `categories` alanında `[[Books]]` vardır. Vault'ta filmler (`[[Movies]]`),
  diziler (`[[Shows]]`), oyunlar, tarifler, yerler ve konu sayfaları da var; başlığa göre değil
  `categories` alanına göre filtrele (ör. `Dune.md` kitap, `Dune - Part One.md` film).
- Dosya adı kitabın başlığıdır; aynı adlı başka bir not varsa `Başlık - Yazar.md`.
- Türkçe ve İngilizce baskılar vault'ta TEK nottur; ayrı not açma, `format` alanına ekle.
- Gövde `## Notlarım` başlığıyla başlar; kişisel notlarımdır, siteye asla aktarılmaz.

### Frontmatter alanları

- `author`: wikilink listesi, ör. `- "[[Max Tegmark]]"`
- `topics`: wikilink listesi. Yalnızca mevcut sözlükten seç, yeni konu uydurma:
  Contemporary Fiction, Marketing, UI-UX, Science Fiction, Databases, Ideas & Society,
  Software Development, Artificial Intelligence, History & Culture, Self-Improvement,
  Thinking & Decision Making, Productivity & Habits, Psychology & Behavior, Startups & Business,
  Agile, Science & Nature, Mental Health, Leadership & Career, Products, Money & Finance,
  Relationships & People, Humanism
- `status`: Backlog, To Read, Reading, Read, Did Not Finish
- `format` (liste): Kindle, Apple Books, Paperback, Hard Cover, Audible, StoryTel
- `language`: English veya Turkish (açık yazılır)
- `last`: okumayı bitirdiğim tarih, `YYYY-MM-DD` (sitede "okunma tarihi" olarak görünür)
- `rating`: 1–5
- `depth`: Deep reads, Medium reads, Skim reads
- `pages`, `year`, `isbn`, `isbn13`, `cover` (görsel URL'si), `goodreads` (URL), `created`, `readingplan`

### Düzenleme kuralları

- "X'i bitirdim" dediğimde: `status: Read` ve `last: <tarih>` yap. Tarihi ben söylemediysem sor.
  Puan vermediysem `rating` alanını boş bırak.
- Bibliyografik bilgi uydurma. Emin olmadığın `pages`, `isbn`, `goodreads`, `rating` alanlarını boş bırak, gerekirse bana sor.
- Vault'ta bir notu değiştirmeden ya da silmeden önce neyin değişeceğini göster ve onayımı bekle.
- Değişikliğe yalnızca ilgili satırlar girsin; frontmatter düzenini ve diğer alanları olduğu gibi koru.

## Repo

- Derleme adımı yok: `index.html`, `styles.css`, `app.js` (EN/TR arayüz metinleri `I18N` içinde),
  `sw.js` (service worker), `manifest.webmanifest`, `data/books.json`, `scripts/export_vault.py`.
- `app.js`, `styles.css` veya `index.html` değişirse `sw.js` içindeki `SHELL` önbellek sürümünü bir artır
  (ör. `kitapligim-shell-v2` → `v3`); yoksa ana ekrana eklenmiş uygulama eski sürümde kalabilir.
  Yalnızca `data/books.json` değiştiyse gerek yok.
- Arayüz varsayılan olarak İngilizce, sağ üstte TR/EN geçişi var. Yeni metin eklerken iki dili de doldur.
- Commit mesajları kısa ve İngilizce olsun (ör. "Mark Life 3.0 as read").
- Commit ve push'tan önce `git diff --stat` ile değişen dosyaları göster ve onayımı bekle.
