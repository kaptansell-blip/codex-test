"""
touchandbook.com sitesinden rezervasyon ve katılımcı bilgilerini çeker,
SQLite veritabanına kaydeder.

Kullanım:
    python scraper.py            → son 7 gün + ileriki 180 gün
    python scraper.py 30 360     → son 30 gün + ileriki 360 gün
"""

import asyncio
import logging
import os
import sys
from datetime import datetime, timedelta

from playwright.async_api import async_playwright, TimeoutError as PW_Timeout

import database as db
from config import USERNAME, PASSWORD, LOGIN_URL, FILTRE_TUR_TIPI, HEADLESS

# ── Loglama ──────────────────────────────────────────────────────────────────
os.makedirs("screenshots", exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("scraper.log", encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)


# ── Yardımcı: ilk eşleşen seçiciyi doldur / tıkla ───────────────────────────

async def _fill(page, selectors: list[str], value: str) -> bool:
    for sel in selectors:
        try:
            await page.fill(sel, value, timeout=3_000)
            return True
        except Exception:
            pass
    return False


async def _click(page, selectors: list[str]) -> bool:
    for sel in selectors:
        try:
            await page.click(sel, timeout=3_000)
            return True
        except Exception:
            pass
    return False


# ── 1. GİRİŞ ─────────────────────────────────────────────────────────────────

async def login(page):
    log.info("Giris sayfasina gidiliyor...")
    await page.goto(LOGIN_URL, wait_until="domcontentloaded", timeout=60_000)

    log.info("=" * 60)
    log.info(">>> TARAYICI ACILDI!")
    log.info(">>> Cloudflare kutucugu gorunuyorsa TIKLAYINIZ.")
    log.info(">>> Giris formu gelene kadar bekliyorum (max 2 dakika)...")
    log.info("=" * 60)

    # Kullanici Cloudflare kutucugunu tiklayinca giris formu gelir
    try:
        await page.wait_for_selector(
            "input[type='text'], input[type='password'], "
            "input[name*='User'], input[name*='user'], "
            "input[id*='User'], input[id*='user']",
            timeout=120_000,  # 2 dakika bekle
        )
        log.info("Giris formu gorundu, devam ediliyor...")
    except Exception:
        await page.screenshot(path="screenshots/01_login.png")
        raise RuntimeError(
            "2 dakika icerisinde giris formuna ulasilamadi.\n"
            "screenshots/01_login.png dosyasina bakin."
        )
    await page.screenshot(path="screenshots/01_login.png")

    kullanici_ok = await _fill(page, [
        "#txtUserName",
        "input[name*='UserName']",
        "input[name*='user']",
        "input[placeholder*='Kullanıcı']",
        "input[type='text']",
    ], USERNAME)

    sifre_ok = await _fill(page, [
        "#txtPassword",
        "input[name*='Password']",
        "input[type='password']",
    ], PASSWORD)

    if not kullanici_ok or not sifre_ok:
        raise RuntimeError(
            "Kullanıcı adı veya şifre alanı bulunamadı!\n"
            "screenshots/01_login.png dosyasına bakın."
        )

    giris_ok = await _click(page, [
        "#btnLogin",
        "input[type='submit']",
        "button[type='submit']",
        "button:has-text('Giriş')",
        "input[value*='Giriş']",
    ])
    if not giris_ok:
        raise RuntimeError("Giriş butonu bulunamadı!")

    await page.wait_for_load_state("networkidle", timeout=30_000)
    await page.screenshot(path="screenshots/02_after_login.png")

    if "login" in page.url.lower():
        raise RuntimeError(
            "Giriş BAŞARISIZ. Kullanıcı adı / şifreyi config.py'de kontrol edin.\n"
            "screenshots/02_after_login.png dosyasına bakın."
        )
    log.info(f"Giriş başarılı → {page.url}")


# ── 2. TUR LİSTESİ SAYFASINA GİT ────────────────────────────────────────────

async def navigate_to_tur(page):
    log.info("Tur listesi sayfasına gidiliyor…")

    # Menü yollarını dene
    menu_pairs = [
        ("Rezervasyonlar", "Tur"),
        ("Ürün",           "Tur"),
        ("Raporlar",       "Tur"),
    ]

    for ana_menu, alt_menu in menu_pairs:
        try:
            await page.click(f"text={ana_menu}", timeout=4_000)
            await page.wait_for_timeout(800)
            await page.click(f"text={alt_menu}", timeout=4_000)
            await page.wait_for_load_state("networkidle", timeout=20_000)
            if "tur" in page.url.lower() or "tour" in page.url.lower():
                log.info(f"Tur sayfasına ulaşıldı → {page.url}")
                await page.screenshot(path="screenshots/03_tur_list.png")
                return
        except Exception:
            pass

    # Son çare: mevcut URL'den base URL alıp doğrudan git
    base = "/".join(page.url.split("/")[:3])
    for path in ["/Tour/TourList.aspx", "/Tur/List.aspx", "/Rezervasyon/Tur.aspx"]:
        try:
            await page.goto(base + path, wait_until="networkidle", timeout=20_000)
            if page.url != LOGIN_URL:
                log.info(f"Doğrudan yönlendirme ile ulaşıldı → {page.url}")
                await page.screenshot(path="screenshots/03_tur_list.png")
                return
        except Exception:
            pass

    raise RuntimeError(
        "Tur listesi sayfasına ulaşılamadı!\n"
        "screenshots/02_after_login.png dosyasına bakın ve menü yapısını kontrol edin."
    )


# ── 3. ARAMA KRİTERLERİNİ AYARLA VE ARA ─────────────────────────────────────

async def search(page, baslangic: datetime, bitis: datetime):
    bas_str = baslangic.strftime("%d.%m.%Y")
    bit_str  = bitis.strftime("%d.%m.%Y")
    log.info(f"Arama: {bas_str} – {bit_str}")

    # İlk iki text input tarih alanı olmalı (ASP.NET DatePicker)
    date_inputs = await page.query_selector_all(
        "input[type='text'][id*='Date'], "
        "input[type='text'][id*='date'], "
        "input[type='text'][id*='Tarih'], "
        "input[type='text'][id*='tarih']"
    )
    if len(date_inputs) < 2:
        # Fallback: sayfadaki tüm text inputlar
        date_inputs = await page.query_selector_all("input[type='text']")

    if len(date_inputs) >= 2:
        await date_inputs[0].triple_click()
        await date_inputs[0].fill(bas_str)
        await page.keyboard.press("Tab")
        await date_inputs[1].triple_click()
        await date_inputs[1].fill(bit_str)
        await page.keyboard.press("Tab")
        await page.wait_for_timeout(400)
    else:
        log.warning("Tarih inputları bulunamadı, tarihsiz arama yapılıyor.")

    # "Ara" butonuna bas
    ara_ok = await _click(page, [
        "button:has-text('Ara')",
        "input[value='Ara']",
        "input[type='submit'][value*='Ara']",
        "#btnSearch",
        "a:has-text('Ara')",
    ])
    if not ara_ok:
        raise RuntimeError("'Ara' butonu bulunamadı!")

    await page.wait_for_load_state("networkidle", timeout=30_000)
    await page.screenshot(path="screenshots/04_search_results.png")
    log.info("Arama tamamlandı.")


# ── 4. KATILIMCI TABLOSUNU ÇEK ───────────────────────────────────────────────

async def extract_katilimcilar(page, rezervasyon_no: str) -> list[dict]:
    """
    Detay sayfasındaki Katılımcılar tablosunu parse eder.
    Tablo başlıkları Türkçe; Excel'deki sıraya göre map edilir.
    """
    await page.wait_for_load_state("networkidle", timeout=20_000)
    await page.screenshot(path=f"screenshots/detail_{rezervasyon_no[:10]}.png")

    tables = await page.query_selector_all("table")
    for table in tables:
        header_text = await table.inner_text()
        # Katılımcı tablosunu bul (İsim + Soyisim + Kimlik içeriyor mu?)
        if "İsim" not in header_text or "Soyisim" not in header_text:
            continue

        rows = await table.query_selector_all("tbody tr")
        katilimcilar = []

        for row in rows:
            cells = await row.query_selector_all("td")
            vals = [((await c.inner_text()).strip()) for c in cells]

            # En az isim + soyisim sütunu olsun
            if len(vals) < 7:
                continue

            # Excel ekran görüntüsündeki sütun sırası:
            # 0:No  1:OdaYatak  2:PnrOda  3:Cinsiyet  4:Tip  5:İsim  6:Soyisim
            # 7:Doğum  8:Uyruk  9:Kimlik  10:Pasaport  11:PasGec  12:PasTip
            # 13:PasVeriUlke  14:PasVerisTarih  15:Telefon  16:Biniş
            # 17:EkstraTur  18:EkServis  19:FiyatGrubu  20:Tutar  21:Pnr
            # 22:Acente  23:Not  24:RezNot  25:AcilDurum
            def v(i):
                return vals[i] if i < len(vals) else ""

            k = {
                "rezervasyon_no":          rezervasyon_no,
                "oda_no":                  v(0),
                "oda_yatak_tipi":          v(1),
                "pnr_oda":                 v(2),
                "cinsiyet":                v(3),
                "tip":                     v(4),
                "isim":                    v(5),
                "soyisim":                 v(6),
                "dogum_tarihi":            v(7),
                "uyruk":                   v(8),
                "kimlik_no":               v(9),
                "pasaport_no":             v(10),
                "pasaport_gecerlilik":     v(11),
                "pasaport_tip":            v(12),
                "pasaport_verildi_ulke":   v(13),
                "pasaport_verilis_tarihi": v(14),
                "telefon":                 v(15),
                "binis_noktasi":           v(16),
                "ekstra_turlar":           v(17),
                "ek_servis":               v(18),
                "fiyat_grubu":             v(19),
                "tutar":                   v(20),
                "pnr":                     v(21),
                "acente":                  v(22),
                "notlar":                  v(23),
                "rezervasyon_notu":        v(24),
                "acil_durum_bilgisi":      v(25),
            }

            # Boş satır mı?
            if k["isim"] or k["soyisim"]:
                katilimcilar.append(k)

        if katilimcilar:
            log.info(f"  → {len(katilimcilar)} katılımcı alındı")
            return katilimcilar

    log.warning(f"  → Katılımcı tablosu bulunamadı ({rezervasyon_no})")
    return []


# ── 5. ANA SCRAPER ───────────────────────────────────────────────────────────

async def run(baslangic: datetime, bitis: datetime):
    db.init_db()

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=HEADLESS,
            args=[
                "--start-maximized",
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage",
            ],
        )
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            locale="tr-TR",
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
        )
        # Playwright'i gercek tarayici gibi goster
        await context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )
        page = await context.new_page()

        try:
            await login(page)
            await navigate_to_tur(page)
            await search(page, baslangic, bitis)

            sayfa_no = 1
            toplam_islenen = 0
            islenen_rezervasyonlar: set[str] = set()

            while True:
                log.info(f"── Sayfa {sayfa_no} ──────────────────────")

                # Tablo satırlarını oku
                rows = await page.query_selector_all("table tbody tr")
                log.info(f"{len(rows)} satır bulundu")

                # Her satır için tur verisini topla
                tur_listesi = []
                for row in rows:
                    try:
                        cells = await row.query_selector_all("td")
                        vals  = [((await c.inner_text()).strip()) for c in cells]

                        if len(vals) < 9:
                            continue

                        # Tur tipini kontrol et
                        tur_tipi_val = ""
                        for v in vals:
                            if v in ("Gemi", "Konaklamalı Tur", "Transfer"):
                                tur_tipi_val = v
                                break

                        if FILTRE_TUR_TIPI and tur_tipi_val != FILTRE_TUR_TIPI:
                            continue

                        # Sütun sırası (0 = eylem butonu yok varsayımı):
                        # 0:İşlemTarihi  1:Sağlayıcı  2:TurKodu  3:RezNo
                        # 4:FirmaRef  5:İşlemTipi  6:Başlangıç  7:Bitiş
                        # 8:TurTipi  9:ServiceAdı  10:Yolcu  11:Oda  12:Misafir
                        # 13:Sözleşme  14:Tutar  15:EkstraTur  16:RezNot  17:SatışKanalı
                        def g(i):
                            return vals[i] if i < len(vals) else ""

                        rez_no = g(3).strip()
                        if not rez_no or rez_no in islenen_rezervasyonlar:
                            continue

                        tur_listesi.append({
                            "rezervasyon_no":  rez_no,
                            "tur_kodu":        g(2),
                            "service_adi":     g(9),
                            "baslangic_tarihi":g(6),
                            "bitis_tarihi":    g(7),
                            "tur_tipi":        tur_tipi_val,
                            "saglayici":       g(1),
                            "firma_referansi": g(4),
                            "yolcu_adi":       g(10),
                            "toplam_oda":      g(11),
                            "toplam_misafir":  g(12),
                            "toplam_tutar":    g(14),
                        })

                    except Exception as e:
                        log.warning(f"Satır okunurken hata: {e}")

                log.info(f"Bu sayfada {len(tur_listesi)} işlenecek rezervasyon")

                # Her rezervasyon için detay sayfasına git
                for idx, tur_data in enumerate(tur_listesi):
                    rez_no = tur_data["rezervasyon_no"]
                    log.info(
                        f"  [{idx+1}/{len(tur_listesi)}] {rez_no} "
                        f"| {tur_data['service_adi'][:60]}"
                    )

                    try:
                        # "i" butonunu bul — sayfa yenilenmemiş olduğu için
                        # tekrar sayfayı arama sonuçlarıyla yükle ve doğru satıra git
                        # En güvenilir yöntem: rezervasyon numarasını içeren satırdaki linki bul
                        info_link = await page.query_selector(
                            f"tr:has-text('{rez_no}') a[title*='Detay'], "
                            f"tr:has-text('{rez_no}') a[title*='detay'], "
                            f"tr:has-text('{rez_no}') a.btn-info, "
                            f"tr:has-text('{rez_no}') td:first-child a, "
                            f"tr:has-text('{rez_no}') a:first-of-type"
                        )

                        if not info_link:
                            # Fallback: sayfadaki tüm info butonlarını al, sıradakini tıkla
                            info_buttons = await page.query_selector_all(
                                "table tbody tr a[title], "
                                "table tbody tr a.btn-info, "
                                "table tbody tr td:first-child a"
                            )
                            if idx < len(info_buttons):
                                info_link = info_buttons[idx]

                        if not info_link:
                            log.warning(f"  'i' butonu bulunamadı: {rez_no}, atlanıyor")
                            continue

                        # Yeni sekmede aç (ASP.NET PostBack sorunlarından kaçınmak için)
                        detail_url = await info_link.get_attribute("href")
                        if detail_url:
                            if not detail_url.startswith("http"):
                                base = "/".join(page.url.split("/")[:3])
                                detail_url = base + "/" + detail_url.lstrip("/")
                            detail_page = await context.new_page()
                            await detail_page.goto(detail_url, wait_until="networkidle", timeout=30_000)
                        else:
                            # JavaScript onclick ise aynı sayfada tıkla
                            detail_page = page
                            await info_link.click()
                            await detail_page.wait_for_load_state("networkidle", timeout=30_000)

                        # Katılımcıları çek
                        katilimcilar = await extract_katilimcilar(detail_page, rez_no)

                        # Veritabanına kaydet
                        db.upsert_tur(tur_data)
                        db.delete_katilimcilar(rez_no)
                        for k in katilimcilar:
                            db.insert_katilimci(k)

                        islenen_rezervasyonlar.add(rez_no)
                        toplam_islenen += 1
                        log.info(f"  ✓ Kaydedildi: {rez_no}")

                        # Yeni sekme açıldıysa kapat
                        if detail_page != page:
                            await detail_page.close()
                        else:
                            await page.go_back()
                            await page.wait_for_load_state("networkidle", timeout=20_000)

                    except Exception as e:
                        log.error(f"  Hata ({rez_no}): {e}")
                        await page.screenshot(path=f"screenshots/hata_{rez_no[:10]}.png")
                        # Ana sayfaya dön
                        try:
                            if len(context.pages) > 1:
                                for p in context.pages[1:]:
                                    await p.close()
                        except Exception:
                            pass
                        try:
                            await page.go_back()
                            await page.wait_for_load_state("networkidle", timeout=15_000)
                        except Exception:
                            pass

                # Sonraki sayfa var mı?
                next_btn = None
                for sel in ["a:has-text('Sonraki')", "li.next a", "a[aria-label='Next']", ".pagination a:last-child"]:
                    try:
                        el = await page.query_selector(sel)
                        if el and await el.is_visible():
                            next_btn = el
                            break
                    except Exception:
                        pass

                if not next_btn:
                    log.info("Son sayfaya ulaşıldı.")
                    break

                await next_btn.click()
                await page.wait_for_load_state("networkidle", timeout=20_000)
                sayfa_no += 1

            log.info(f"\n✅ TAMAMLANDI — Toplam {toplam_islenen} rezervasyon işlendi.\n")

        except Exception as e:
            log.error(f"KRİTİK HATA: {e}")
            await page.screenshot(path="screenshots/kritik_hata.png")
            raise
        finally:
            await browser.close()


# ── Komut satırı girişi ───────────────────────────────────────────────────────

if __name__ == "__main__":
    gecmis_gun   = int(sys.argv[1]) if len(sys.argv) > 1 else 7
    ileri_gun    = int(sys.argv[2]) if len(sys.argv) > 2 else 180
    bas = datetime.now() - timedelta(days=gecmis_gun)
    bit = datetime.now() + timedelta(days=ileri_gun)
    log.info(f"Scraper başlıyor: {bas.strftime('%d.%m.%Y')} – {bit.strftime('%d.%m.%Y')}")
    asyncio.run(run(bas, bit))
