# Demir Defteri

Spor salonunda kullanmak için yapılmış, telefon öncelikli bir antrenman defteri.
Kurulum, hesap ya da bağımlılık gerektirmez; tek sayfalık bir web uygulamasıdır.

## Neler yapar?

- **Antrenman kaydı** – Programını başlat, her set için kilo ve tekrarı gir, tamamladıkça işaretle.
  Boş bıraktığın alanlar geçen seferki değerlerle dolar.
- **Dinlenme sayacı** – Seti işaretleyince geri sayım başlar; süre dolunca ses ve titreşimle haber verir.
- **Programlar** – İtiş / Çekiş / Bacak / Tüm Vücut hazır gelir; düzenleyebilir ya da kendi programını kurabilirsin.
- **Egzersiz kütüphanesi** – 59 hazır hareket, arama ve kas grubu filtresi; kendi hareketini de ekleyebilirsin.
- **Geçmiş** – Biten her antrenman tarihi, süresi, setleri ve toplam hacmiyle saklanır; tek dokunuşla tekrarlanır.
- **İlerleme** – Haftalık hacim grafiği, hareket bazında tahmini 1TM (Epley) grafiği ve kişisel rekorlar.
- **Araçlar** – Plaka hesaplayıcı (bara hangi plakalar takılacak), 1TM hesaplayıcı, yedek alma / geri yükleme.
- Antrenman sırasında ekranı açık tutar, açık ve koyu temayı destekler, çevrimdışı çalışır.

## Çalıştırma

Derleme adımı yok. Klasörü herhangi bir statik sunucuyla aç:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Telefonda kullanmak için depoyu GitHub Pages ile yayınla (Settings → Pages → Branch: `main`, klasör: `/`),
açılan adresi telefonun tarayıcısında aç ve "Ana ekrana ekle" ile uygulama gibi kur.

## Veriler

Kayıtlar tarayıcının `localStorage` alanında, yalnızca o cihazda tutulur. Tarayıcı verilerini silersen
kaybolur; **Araçlar → Yedek al** ile metin olarak dışa aktarıp **Yedekten geri yükle** ile geri alabilirsin.

Sayfa bir Claude Artifact'i olarak açıldığında kayıtlar ayrıca kullanıcıya özel bulut deposuyla eşitlenir;
bağlantı yokken yapılan değişiklikler cihazda bekler ve bağlantı gelince gönderilir.

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| `index.html` | Sayfa kabuğu, PWA etiketleri |
| `styles.css` | Tüm stiller (açık / koyu tema belirteçleri en üstte) |
| `app.js` | Uygulama mantığı: durum, görünümler, grafikler, eşitleme |
| `sw.js` | Çevrimdışı önbellek (service worker) |
| `manifest.webmanifest`, `icons/` | Ana ekrana ekleme için uygulama bilgisi ve simgeler |
