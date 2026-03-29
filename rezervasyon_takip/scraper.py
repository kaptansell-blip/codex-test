"""
touchandbook.com sitesinden tur tarihi ve katilimci bilgilerini ceker.
nodriver kullanir (Cloudflare bypass icin).

Kullanim:
    python scraper.py            -> bugunden itibaren 180 gun
    python scraper.py 30 360     -> son 30 gun + ileriki 360 gun
"""

import asyncio
import logging
import os
import sys
from datetime import datetime, timedelta

import nodriver as uc

import database as db
from config import USERNAME, PASSWORD, LOGIN_URL

# ── URL sabitlari ─────────────────────────────────────────────────────────────
TUR_DATE_LIST_URL = (
    "https://panel.touchandbook.com"
    "/Pages/Products/Charter/Tour/Group/TourDateList.aspx"
)

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


# ── Yardimci ─────────────────────────────────────────────────────────────────

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


# ── 1. GIRIS ─────────────────────────────────────────────────────────────────

async def login(tab):
    log.info("Giris sayfasina gidiliyor...")
    await tab.get(LOGIN_URL)
    await asyncio.sleep(8)
    await tab.save_screenshot("screenshots/01_login.png")

    # Cloudflare kutucugu ciktiysa kullanicinin gecmesini bekle
    try:
        cf = await tab.select("#challenge-form", timeout=2)
    except Exception:
        cf = None

    if cf or "challenge" in str(tab.url):
        log.info("=" * 60)
        log.info(">>> TARAYICIDA KUTUCUGA TIKLAYIN!")
        log.info(">>> Giris formu gelene kadar bekliyorum...")
        log.info("=" * 60)
        for _ in range(120):
            await asyncio.sleep(1)
            try:
                el = await tab.select("input[type='password']", timeout=1)
                if el:
                    break
            except Exception:
                pass

    kullanici_ok = await _fill(tab, [
        "#txtUserName", "input[name*='UserName']",
        "input[name*='user']", "input[type='text']",
    ], USERNAME)

    if not kullanici_ok:
        await tab.save_screenshot("screenshots/01_login.png")
        raise RuntimeError("Kullanici adi alani bulunamadi!")

    sifre_ok = await _fill(tab, [
        "#txtPassword", "input[name*='Password']", "input[type='password']",
    ], PASSWORD)

    if not sifre_ok:
        raise RuntimeError("Sifre alani bulunamadi!")

    await _click_sel(tab, [
        "#btnLogin", "input[type='submit']", "button[type='submit']",
    ])

    await asyncio.sleep(4)
    await tab.save_screenshot("screenshots/02_after_login.png")

    if "login" in str(tab.url).lower():
        raise RuntimeError("Giris basarisiz! config.py'deki kullanici adi/sifre kontrol edin.")

    log.info(f"Giris basarili -> {tab.url}")


# ── 2. TUR TARIHİ SAYFASINA GIT ──────────────────────────────────────────────

async def navigate_to_tur_tarihi(tab):
    log.info(f"Tur Tarihi sayfasina gidiliyor: {TUR_DATE_LIST_URL}")
    await tab.get(TUR_DATE_LIST_URL)
    await asyncio.sleep(4)
    await tab.save_screenshot("screenshots/03_tur_tarihi.png")

    if "error" in str(tab.url).lower() or "login" in str(tab.url).lower():
        raise RuntimeError(
            f"Tur Tarihi sayfasina erisim hatasi: {tab.url}\n"
            "screenshots/03_tur_tarihi.png dosyasina bakin."
        )

    log.info(f"Tur Tarihi sayfasi acildi: {tab.url}")


# ── 3. TARİH FİLTRESİ VE ARAMA ───────────────────────────────────────────────

async def search_by_date(tab, baslangic: datetime, bitis: datetime):
    bas_str = baslangic.strftime("%d.%m.%Y")
    bit_str  = bitis.strftime("%d.%m.%Y")
    log.info(f"Tarih araligi: {bas_str} - {bit_str}")

    await asyncio.sleep(2)

    # "Tarih Araligi" etiketinin yaninidaki iki date input'u bul
    # Sayfada birden fazla input var; tarih araligina ozel olanlari bulmaya calis
    date_inputs = await tab.select_all(
        "input[id*='Date'], input[id*='date'], "
        "input[id*='Tarih'], input[id*='tarih'], "
        "input[placeholder*='gg'], input[placeholder*='GG']"
    )

    if len(date_inputs) < 2:
        # Fallback: sayfadaki tum text inputlari al
        date_inputs = await tab.select_all("input[type='text']")

    log.info(f"Bulunan date input sayisi: {len(date_inputs)}")

    if len(date_inputs) >= 2:
        # Onceki degerleri temizle ve yaz
        try:
            await date_inputs[0].mouse_click()
            await asyncio.sleep(0.3)
            await tab.key_down("ctrl")
            await tab.send_keys("a")
            await tab.key_up("ctrl")
            await tab.send_keys(bas_str)
        except Exception:
            await date_inputs[0].send_keys(bas_str)

        await asyncio.sleep(0.3)

        try:
            await date_inputs[1].mouse_click()
            await asyncio.sleep(0.3)
            await tab.key_down("ctrl")
            await tab.send_keys("a")
            await tab.key_up("ctrl")
            await tab.send_keys(bit_str)
        except Exception:
            await date_inputs[1].send_keys(bit_str)

        await asyncio.sleep(0.3)
    else:
        log.warning("Tarih inputlari bulunamadi, tarihsiz arama yapiliyor.")

    # Ara butonuna bas
    ara_ok = False
    try:
        el = await tab.find("Ara", timeout=4)
        if el:
            await el.click()
            ara_ok = True
    except Exception:
        pass

    if not ara_ok:
        await _click_sel(tab, ["input[value='Ara']", "#btnSearch", "button.btn-danger"])

    await asyncio.sleep(5)
    await tab.save_screenshot("screenshots/04_search_results.png")
    log.info("Arama tamamlandi.")


# ── 4. KATILIMCI TABLOSUNU CEK ────────────────────────────────────────────────

async def extract_katilimcilar(tab, tur_kodu: str) -> list:
    await asyncio.sleep(4)
    await tab.save_screenshot(f"screenshots/detail_{tur_kodu[:15]}.png")
    log.info(f"Detay sayfasi: {tab.url}")

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
                "rezervasyon_no":          tur_kodu,
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

    log.warning(f"  -> Katilimci tablosu bulunamadi ({tur_kodu})")
    await tab.save_screenshot(f"screenshots/detail_no_table_{tur_kodu[:15]}.png")
    return []


# ── 5. ANA SCRAPER ───────────────────────────────────────────────────────────

async def run(baslangic: datetime, bitis: datetime):
    db.init_db()

    browser = await uc.start(headless=False)
    tab = await browser.get("about:blank")

    try:
        await login(tab)
        await navigate_to_tur_tarihi(tab)
        await search_by_date(tab, baslangic, bitis)

        sayfa_no = 1
        toplam_islenen = 0
        islenen_turlar: set = set()

        while True:
            log.info(f"-- Sayfa {sayfa_no} --")

            liste_url = str(tab.url)
            rows = await tab.select_all("table tbody tr")
            log.info(f"{len(rows)} tur satiri bulundu")

            tur_listesi = []
            for row in rows:
                try:
                    cells = await row.query_selector_all("td")
                    vals  = [(c.text or "").strip() for c in cells]

                    if len(vals) < 3:
                        continue

                    # TourDateList sutunlari:
                    # 0: checkbox  1: Tur Adi  2: Tur Kodu  3: Saglayici
                    # 4: Baslangic-Bitis  5: Hareket  6: Toplam  7: Kullanilan
                    # 8: Kalan  9: Op.Durum  10: Durum  11: Butonlar
                    def g(i): return vals[i] if i < len(vals) else ""

                    tur_kodu = g(2).strip()
                    if not tur_kodu or tur_kodu in islenen_turlar:
                        continue

                    # Tarih araligini ayristir
                    tarih_str = g(4)
                    bas_tarih = tarih_str.split(" - ")[0].strip() if " - " in tarih_str else tarih_str
                    bit_tarih = tarih_str.split(" - ")[1].strip() if " - " in tarih_str else ""

                    tur_listesi.append({
                        "rezervasyon_no":  tur_kodu,
                        "tur_kodu":        tur_kodu,
                        "service_adi":     g(1),
                        "baslangic_tarihi":bas_tarih,
                        "bitis_tarihi":    bit_tarih,
                        "tur_tipi":        "Gemi",
                        "saglayici":       g(3),
                        "firma_referansi": "",
                        "yolcu_adi":       "",
                        "toplam_oda":      g(7),   # Kullanilan kontejan
                        "toplam_misafir":  g(7),
                        "toplam_tutar":    "",
                    })

                except Exception as e:
                    log.warning(f"Satir parse hatasi: {e}")

            log.info(f"Bu sayfada {len(tur_listesi)} tur")

            for idx, tur_data in enumerate(tur_listesi):
                tur_kodu = tur_data["tur_kodu"]
                log.info(
                    f"  [{idx+1}/{len(tur_listesi)}] {tur_kodu} "
                    f"| {tur_data['service_adi'][:55]}"
                )

                try:
                    # Sarı/turuncu detay butonunu bul
                    rows_fresh = await tab.select_all("table tbody tr")
                    detail_link = None

                    for r in rows_fresh:
                        r_text = r.text or ""
                        if tur_kodu in r_text:
                            # Once btn-warning (sari), sonra btn-info, sonra ilk link
                            for btn_sel in [
                                "a.btn-warning",
                                "a[class*='warning']",
                                "a[title*='etay']",
                                "a[title*='etail']",
                                "a[href*='etail']",
                                "a[href*='etay']",
                            ]:
                                try:
                                    b = await r.query_selector(btn_sel)
                                    if b:
                                        detail_link = b
                                        break
                                except Exception:
                                    pass

                            # Hala bulunamadiysa satirdaki tum linklere bak
                            if not detail_link:
                                links = await r.query_selector_all("a")
                                if links:
                                    # Sarı/turuncu buton genellikle 2. veya 3. link
                                    for lnk in links:
                                        attrs = lnk.attrs or {}
                                        cls = attrs.get("class", "")
                                        if "warning" in cls or "info" in cls:
                                            detail_link = lnk
                                            break
                                    if not detail_link and len(links) >= 2:
                                        detail_link = links[1]  # 2. butonu dene

                            break

                    if not detail_link:
                        log.warning(f"  Detay butonu bulunamadi: {tur_kodu}")
                        await tab.save_screenshot(f"screenshots/no_btn_{tur_kodu[:10]}.png")
                        continue

                    # Detay sayfasina git
                    href = (detail_link.attrs or {}).get("href", "")
                    if href:
                        if not href.startswith("http"):
                            base = "https://panel.touchandbook.com"
                            href = base + "/" + href.lstrip("/")
                        await tab.get(href)
                    else:
                        await detail_link.click()

                    # Katilimcilari cek
                    katilimcilar = await extract_katilimcilar(tab, tur_kodu)

                    # Veritabanina kaydet
                    db.upsert_tur(tur_data)
                    db.delete_katilimcilar(tur_kodu)
                    for k in katilimcilar:
                        db.insert_katilimci(k)

                    islenen_turlar.add(tur_kodu)
                    toplam_islenen += 1
                    log.info(f"  V Kaydedildi: {tur_kodu} ({len(katilimcilar)} katilimci)")

                    # Tur listesine geri don
                    await tab.get(liste_url)
                    await asyncio.sleep(2)

                except Exception as e:
                    log.error(f"  Hata ({tur_kodu}): {e}")
                    try:
                        await tab.save_screenshot(f"screenshots/hata_{tur_kodu[:10]}.png")
                    except Exception:
                        pass
                    await tab.get(liste_url)
                    await asyncio.sleep(2)

            # Sonraki sayfa var mi?
            next_btn = None
            for text in ["Sonraki", ">", "»"]:
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

        log.info(f"\nTAMAMLANDI - Toplam {toplam_islenen} tur islendi.\n")

    except Exception as e:
        log.error(f"KRITIK HATA: {e}")
        try:
            await tab.save_screenshot("screenshots/kritik_hata.png")
        except Exception:
            pass
        raise
    finally:
        browser.stop()


# ── Komut satiri ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    gecmis_gun = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    ileri_gun  = int(sys.argv[2]) if len(sys.argv) > 2 else 180
    bas = datetime.now() - timedelta(days=gecmis_gun)
    bit = datetime.now() + timedelta(days=ileri_gun)
    log.info(f"Scraper basliyor: {bas.strftime('%d.%m.%Y')} - {bit.strftime('%d.%m.%Y')}")
    uc.loop().run_until_complete(run(bas, bit))
