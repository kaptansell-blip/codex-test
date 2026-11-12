# Neva & Kremlin Rehberi

St. Petersburg & Moskova turu (10–15 Kasım 2026) için iPhone'a kurulabilen, çevrimdışı çalışan kişisel seyahat rehberi (PWA). Uygulama `docs/` klasöründedir.

## Özellikler
- **Bugün**: tarihe göre otomatik gün seçimi, sıradaki uçuş, tren ya da etkinliğe geri sayım, günün akışı ve "Şimdi ne yapsam?" önerileri (saate, kapalı günlere, konuma ve otele uzaklığa göre)
- **Program**: 6 günün tamamı, ekstra turları "aldım" diye işaretleme ve bütçe
- **Harita**: tüm yerler, konumunuz ve oteliniz; Wi-Fi'dayken indirilen harita kareleriyle çevrimdışı çalışır
- **Keşfet**: 60'a yakın yer (müze, saray, yemek, alışveriş, metro), arama, favoriler, Yandex / 2GIS / Apple Haritalar bağlantıları ve taksiciye Rusça adres gösterme
- **Belgeler**: uçak ve tren biletleri, e-vize, sigorta (şifreli; parolayla açılır)
- **Menü çevirici**: Rusça menü fotoğrafını telefonda okur (Tesseract OCR) ve yemek sözlüğüyle Türkçeye çevirir; domuz eti ve alkol içeren satırları işaretler. İnternet gerekmez
- **Araçlar**: döviz çevirici, sesli Rusça ifadeler ve Kiril alfabesi, acil numaralar, valiz listesi

## Yayınlama (GitHub Pages)
Settings → Pages → *Deploy from a branch* → bu dal ve `/docs` klasörü.

## Kurulum (iPhone)
Sayfayı Safari'de açın → Paylaş → **Ana Ekrana Ekle**. Ardından Wi-Fi'dayken Araçlar → Çevrimdışı → **Hepsini indir**.

## Gizlilik
Kişisel belgeler depoda düz metin olarak bulunmaz. `docs/data/belgeler.enc.json` dosyası PBKDF2 + AES-256-GCM ile şifrelenmiştir ve yalnızca tarayıcıda çözülür. Yeniden şifrelemek için:
`python3 tools/encrypt_docs.py manifest.json docs/data/belgeler.enc.json "<parola>"`

Harita verisi © OpenStreetMap katkıcıları, harita karoları © Esri. Fotoğraflar, internet varken Wikipedia/Wikimedia Commons'tan alınır.
