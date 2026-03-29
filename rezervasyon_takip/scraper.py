"""
touchandbook.com sitesinden rezervasyon ve katilimci bilgilerini ceker.
nodriver kullanir (Cloudflare bypass icin).

Kullanim:
    python scraper.py            -> son 7 gun + ileriki 180 gun
    python scraper.py 30 360     -> son 30 gun + ileriki 360 gun
"""

import asyncio
import logging
import os
import sys
from datetime import datetime, timedelta

import nodriver as uc

import database as db
from config import USERNAME, PASSWORD, LOGIN_URL, FILTRE_TUR_TIPI

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


# ── Yardimci fonksiyonlar ─────────────────────────────────────────────────────

async def _fill(tab, selectors: list, value: str) -> bool:
    for sel in selectors:
        try:
            el = await tab.select(sel, timeout=3)
            if el:
                await el.send_keys(value)
                return True
        except Exception:
            pass
    return False


async def _click_sel(tab, selectors: list) -> bool:
    for sel in selectors:
        try:
            el = await tab.select(sel, timeout=3)
            if el:
                await el.click()
                return True
        except Exception:
            pass
    return False


async def _click_text(tab, texts: list) -> bool:
    for text in texts:
        try:
            el = await tab.find(text, timeout=3)
            if el:
                await el.click()
                return True
        except Exception:
            pass
    return False


# ── 1. GIRIS ─────────────────────────────────────────────────────────────────

async def login(tab):
    log.info("Giris sayfasina gidiliyor...")
    await tab.get(LOGIN_URL)
    await asyncio.sleep(8)  # Cloudflare otomatik gecmesi icin bekle

    await tab.save_screenshot("screenshots/01_login.png")
    log.info(f"Mevcut URL: {tab.url}")

    # Hala Cloudflare ekranindaysa kullanicidan bekle
    try:
        cf = await tab.select(".cf-turnstile, #challenge-form", timeout=2)
    except Exception:
        cf = None

    if cf or "challenge" in str(tab.url):
        log.info("=" * 60)
        log.info(">>> TARAYICIDA KUTUCUGA TIKLAYIN!")
        log.info(">>> Giris formu gelene kadar bekliyorum (2 dakika)...")
        log.info("=" * 60)
        for _ in range(120):
            await asyncio.sleep(1)
            try:
                el = await tab.select("input[type='password']", timeout=1)
                if el:
                    break
            except Exception:
                pass

    # Kullanici adini doldur
    kullanici_ok = await _fill(tab, [
        "#txtUserName",
        "input[name*='UserName']",
        "input[name*='user']",
        "input[type='text']",
    ], USERNAME)

    if not kullanici_ok:
        await tab.save_screenshot("screenshots/01_login.png")
        raise RuntimeError(
            "Kullanici adi alani bulunamadi!\n"
            "screenshots/01_login.png dosyasina bakin."
        )

    # Sifreyi doldur
    sifre_ok = await _fill(tab, [
        "#txtPassword",
        "input[name*='Password']",
        "input[type='password']",
    ], PASSWORD)

    if not sifre_ok:
        raise RuntimeError("Sifre alani bulunamadi!")

    # Giris butonuna bas
    await _click_sel(tab, [
        "#btnLogin",
        "input[type='submit']",
        "button[type='submit']",
    ])

    await asyncio.sleep(4)
    await tab.save_screenshot("screenshots/02_after_login.png")

    if "login" in str(tab.url).lower():
        raise RuntimeError(
            "Giris basarisiz! Kullanici adi veya sifre yanlis.\n"
            "config.py dosyasini kontrol edin."
        )

    log.info(f"Giris basarili -> {tab.url}")


# ── 2. TUR LISTESI SAYFASINA GIT ─────────────────────────────────────────────

async def navigate_to_tur(tab):
    log.info("Tur listesi sayfasina gidiliyor...")

    # Giris sonrasi b2b.touchandbook.com'a yonlendiyse panel'e don
    if "b2b.touchandbook.com" in str(tab.url):
        log.info("b2b'den panel.touchandbook.com'a geciliyor...")
        await tab.get("https://panel.touchandbook.com/")
        await asyncio.sleep(4)
        log.info(f"Panel URL: {tab.url}")

    # Menu uzerinden gitmeyi dene
    for ana, alt in [("Rezervasyonlar", "Tur"), ("Ürün", "Tur"), ("Urun", "Tur")]:
        try:
            el = await tab.find(ana, timeout=4)
            if el:
                await el.click()
                await asyncio.sleep(1)
                el2 = await tab.find(alt, timeout=4)
                if el2:
                    await el2.click()
                    await asyncio.sleep(3)
                    url_now = str(tab.url)
                    if "tur" in url_now.lower() and "error" not in url_now.lower():
                        log.info(f"Tur sayfasina ulasildi: {tab.url}")
                        await tab.save_screenshot("screenshots/03_tur_list.png")
                        return
        except Exception as e:
            log.debug(f"Menu denemesi basarisiz ({ana}>{alt}): {e}")

    # Direkt URL dene
    base = "https://panel.touchandbook.com"
    for path in [
        "/Tur/TourList.aspx",
        "/Rezervasyon/Tur.aspx",
        "/Tour/TourList.aspx",
        "/Tur/List.aspx",
        "/Rezervasyon/TourList.aspx",
    ]:
        try:
            await tab.get(base + path)
            await asyncio.sleep(3)
            url_now = str(tab.url)
            if "error" not in url_now.lower() and url_now != LOGIN_URL:
                log.info(f"Tur sayfasina ulasildi: {tab.url}")
                await tab.save_screenshot("screenshots/03_tur_list.png")
                return
            log.debug(f"URL hatali: {url_now}")
        except Exception as e:
            log.debug(f"Direkt URL basarisiz ({path}): {e}")

    await tab.save_screenshot("screenshots/03_tur_list_hata.png")
    raise RuntimeError(
        "Tur listesi sayfasina ulasilamadi!\n"
        "screenshots/03_tur_list_hata.png dosyasina bakin.\n"
        "Tarayicida hangi sayfadasiniz not edin."
    )


# ── 3. ARAMA ─────────────────────────────────────────────────────────────────

async def search(tab, baslangic: datetime, bitis: datetime):
    bas_str = baslangic.strftime("%d.%m.%Y")
    bit_str  = bitis.strftime("%d.%m.%Y")
    log.info(f"Arama: {bas_str} - {bit_str}")

    # Sayfanin tamamen yuklenmesini bekle
    await asyncio.sleep(2)

    # Hata sayfasindaysak dur
    if "error" in str(tab.url).lower():
        raise RuntimeError(f"Hata sayfasina yonlendirildi: {tab.url}")

    date_inputs = await tab.select_all("input[type='text']")
    if len(date_inputs) >= 2:
        await date_inputs[0].send_keys(bas_str)
        await asyncio.sleep(0.3)
        await date_inputs[1].send_keys(bit_str)
        await asyncio.sleep(0.3)
    else:
        log.warning("Tarih inputlari bulunamadi, tarihsiz arama yapiliyor.")

    ara_ok = await _click_text(tab, ["Ara"]) or await _click_sel(tab, [
        "input[value='Ara']", "#btnSearch", "input[type='submit']"
    ])
    if not ara_ok:
        log.warning("'Ara' butonu bulunamadi!")

    await asyncio.sleep(5)
    await tab.save_screenshot("screenshots/04_search.png")
    log.info("Arama tamamlandi.")


# ── 4. KATILIMCI TABLOSUNU CEK ────────────────────────────────────────────────

async def extract_katilimcilar(tab, rezervasyon_no: str) -> list:
    await asyncio.sleep(3)
    await tab.save_screenshot(f"screenshots/detail_{rezervasyon_no[:10]}.png")

    tables = await tab.select_all("table")
    for table in tables:
        txt = table.text or ""
        if ("Isim" not in txt and "İsim" not in txt) or "Soyisim" not in txt:
            continue

        rows = await table.query_selector_all("tbody tr")
        katilimcilar = []

        for row in rows:
            cells = await row.query_selector_all("td")
            vals  = [(c.text or "").strip() for c in cells]

            if len(vals) < 7:
                continue

            def v(i): return vals[i] if i < len(vals) else ""

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

            if k["isim"] or k["soyisim"]:
                katilimcilar.append(k)

        if katilimcilar:
            log.info(f"  -> {len(katilimcilar)} katilimci alindi")
            return katilimcilar

    log.warning(f"  -> Katilimci tablosu bulunamadi ({rezervasyon_no})")
    return []


# ── 5. ANA SCRAPER ───────────────────────────────────────────────────────────

async def run(baslangic: datetime, bitis: datetime):
    db.init_db()

    browser = await uc.start(headless=False)
    tab = await browser.get("about:blank")

    try:
        await login(tab)
        await navigate_to_tur(tab)
        await search(tab, baslangic, bitis)

        sayfa_no = 1
        toplam_islenen = 0
        islenen_rezervasyonlar: set = set()

        while True:
            log.info(f"-- Sayfa {sayfa_no} --")

            tur_url = str(tab.url)
            rows = await tab.select_all("table tbody tr")
            log.info(f"{len(rows)} satir bulundu")

            tur_listesi = []
            for row in rows:
                try:
                    cells = await row.query_selector_all("td")
                    vals  = [(c.text or "").strip() for c in cells]

                    if len(vals) < 9:
                        continue

                    tur_tipi_val = ""
                    for val in vals:
                        if val in ("Gemi", "Konaklamalı Tur", "Transfer"):
                            tur_tipi_val = val
                            break

                    if FILTRE_TUR_TIPI and tur_tipi_val != FILTRE_TUR_TIPI:
                        continue

                    def g(i): return vals[i] if i < len(vals) else ""

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
                    log.warning(f"Satir hatasi: {e}")

            log.info(f"Bu sayfada {len(tur_listesi)} Gemi rezervasyonu")

            for idx, tur_data in enumerate(tur_listesi):
                rez_no = tur_data["rezervasyon_no"]
                log.info(f"  [{idx+1}/{len(tur_listesi)}] {rez_no} | {tur_data['service_adi'][:50]}")

                try:
                    # Rezervasyon no'yu iceren satirda linki bul
                    rows_fresh = await tab.select_all("table tbody tr")
                    info_link  = None

                    for r in rows_fresh:
                        r_text = r.text or ""
                        if rez_no in r_text:
                            links = await r.query_selector_all("a")
                            if links:
                                info_link = links[0]
                            break

                    if not info_link:
                        log.warning(f"  'i' butonu bulunamadi: {rez_no}")
                        continue

                    href = (info_link.attrs or {}).get("href", "")
                    if href:
                        if not href.startswith("http"):
                            base = "/".join(str(tab.url).split("/")[:3])
                            href = base + "/" + href.lstrip("/")
                        await tab.get(href)
                    else:
                        await info_link.click()

                    katilimcilar = await extract_katilimcilar(tab, rez_no)

                    db.upsert_tur(tur_data)
                    db.delete_katilimcilar(rez_no)
                    for k in katilimcilar:
                        db.insert_katilimci(k)

                    islenen_rezervasyonlar.add(rez_no)
                    toplam_islenen += 1
                    log.info(f"  V Kaydedildi: {rez_no}")

                    # Listeye geri don
                    await tab.get(tur_url)
                    await asyncio.sleep(2)

                except Exception as e:
                    log.error(f"  Hata ({rez_no}): {e}")
                    try:
                        await tab.save_screenshot(f"screenshots/hata_{rez_no[:10]}.png")
                    except Exception:
                        pass
                    await tab.get(tur_url)
                    await asyncio.sleep(2)

            # Sonraki sayfa var mi?
            next_btn = None
            for text in ["Sonraki", "Next", "»"]:
                try:
                    el = await tab.find(text, timeout=2)
                    if el:
                        next_btn = el
                        break
                except Exception:
                    pass

            if not next_btn:
                log.info("Son sayfaya ulasildi.")
                break

            await next_btn.click()
            await asyncio.sleep(3)
            sayfa_no += 1

        log.info(f"\nTAMAMLANDI - Toplam {toplam_islenen} rezervasyon islendi.\n")

    except Exception as e:
        log.error(f"KRITIK HATA: {e}")
        try:
            await tab.save_screenshot("screenshots/kritik_hata.png")
        except Exception:
            pass
        raise
    finally:
        browser.stop()


# ── Komut satiri girisi ───────────────────────────────────────────────────────

if __name__ == "__main__":
    gecmis_gun = int(sys.argv[1]) if len(sys.argv) > 1 else 7
    ileri_gun  = int(sys.argv[2]) if len(sys.argv) > 2 else 180
    bas = datetime.now() - timedelta(days=gecmis_gun)
    bit = datetime.now() + timedelta(days=ileri_gun)
    log.info(f"Scraper basliyor: {bas.strftime('%d.%m.%Y')} - {bit.strftime('%d.%m.%Y')}")
    uc.loop().run_until_complete(run(bas, bit))
