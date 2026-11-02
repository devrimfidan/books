# 📚 Kitaplığım

Obsidian vault'umdaki (`Emin-Notes/References`) kitap notlarından üretilen kişisel kitaplık.
iPhone'da Safari → Paylaş → **Ana Ekrana Ekle** ile uygulama gibi açılır ve çevrimdışı da çalışır.

**Canlı:** https://devrimfidan.github.io/books/

## Bölümler

- **Raflar**: Şu an okuduklarım, ardından Okundu / Okunacak / Kitaplıkta / Yarım kaldı rafları. Kapak ızgarası ya da liste görünümüyle gezilebilir; okunanlar yıllara göre gruplanır.
- **Ara**: Başlık ve yazara göre arama; raf, konu, format ve dil filtreleri.
- **İstatistik**: Okunan kitap ve sayfa sayısı, yıllara göre okumalar, konular, yazarlar, formatlar ve dil dağılımı.

## Veriyi güncellemek

```bash
python3 scripts/export_vault.py      # vault → data/books.json
git add data/books.json && git commit -m "Kitaplığı güncelle" && git push
```

Betik yalnızca `categories` alanında `[[Books]]` olan notları alır ve frontmatter'ı okur. Notların gövdesi (`## Notlarım`) yayınlanmaz. Yalnızca Python standart kütüphanesini kullanır.

## Kapaklar

1. Notun `cover` alanındaki adres
2. ISBN varsa Open Library kapağı
3. Yoksa uygulama Open Library'de başlık + yazarla arar ve sonucu cihazda önbelleğe alır
4. Hiçbiri yoksa başlık ve yazarla oluşturulan renkli bir kapak gösterilir

## Teknik

Derleme adımı yok: `index.html`, `styles.css`, `app.js`, `sw.js` (çevrimdışı önbellek) ve `manifest.webmanifest`.
