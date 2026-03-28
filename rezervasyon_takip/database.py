"""
Yerel SQLite veritabanı işlemleri.
Tablolar:
  turlar        – her rezervasyonun özet bilgisi
  katilimcilar  – rezervasyona bağlı yolcu detayları
"""

import sqlite3
from datetime import datetime
from config import DB_PATH


def _conn():
    return sqlite3.connect(DB_PATH)


def init_db():
    """Tabloları oluştur (yoksa)."""
    with _conn() as con:
        con.executescript("""
            CREATE TABLE IF NOT EXISTS turlar (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                rezervasyon_no      TEXT UNIQUE,
                tur_kodu            TEXT,
                service_adi         TEXT,
                baslangic_tarihi    TEXT,
                bitis_tarihi        TEXT,
                tur_tipi            TEXT,
                saglayici           TEXT,
                firma_referansi     TEXT,
                yolcu_adi           TEXT,
                toplam_oda          TEXT,
                toplam_misafir      TEXT,
                toplam_tutar        TEXT,
                guncelleme_tarihi   TEXT
            );

            CREATE TABLE IF NOT EXISTS katilimcilar (
                id                      INTEGER PRIMARY KEY AUTOINCREMENT,
                rezervasyon_no          TEXT,
                oda_no                  TEXT,
                oda_yatak_tipi          TEXT,
                pnr_oda                 TEXT,
                cinsiyet                TEXT,
                tip                     TEXT,
                isim                    TEXT,
                soyisim                 TEXT,
                dogum_tarihi            TEXT,
                uyruk                   TEXT,
                kimlik_no               TEXT,
                pasaport_no             TEXT,
                pasaport_gecerlilik     TEXT,
                pasaport_tip            TEXT,
                pasaport_verildi_ulke   TEXT,
                pasaport_verilis_tarihi TEXT,
                telefon                 TEXT,
                binis_noktasi           TEXT,
                ekstra_turlar           TEXT,
                ek_servis               TEXT,
                fiyat_grubu             TEXT,
                tutar                   TEXT,
                pnr                     TEXT,
                acente                  TEXT,
                notlar                  TEXT,
                rezervasyon_notu        TEXT,
                acil_durum_bilgisi      TEXT,
                guncelleme_tarihi       TEXT,
                FOREIGN KEY (rezervasyon_no) REFERENCES turlar(rezervasyon_no)
            );

            CREATE INDEX IF NOT EXISTS idx_tur_baslangic
                ON turlar(baslangic_tarihi);
            CREATE INDEX IF NOT EXISTS idx_katilimci_rezervasyon
                ON katilimcilar(rezervasyon_no);
        """)


def upsert_tur(d: dict):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with _conn() as con:
        con.execute("""
            INSERT OR REPLACE INTO turlar
                (rezervasyon_no, tur_kodu, service_adi, baslangic_tarihi, bitis_tarihi,
                 tur_tipi, saglayici, firma_referansi, yolcu_adi,
                 toplam_oda, toplam_misafir, toplam_tutar, guncelleme_tarihi)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            d.get("rezervasyon_no", ""),
            d.get("tur_kodu", ""),
            d.get("service_adi", ""),
            d.get("baslangic_tarihi", ""),
            d.get("bitis_tarihi", ""),
            d.get("tur_tipi", ""),
            d.get("saglayici", ""),
            d.get("firma_referansi", ""),
            d.get("yolcu_adi", ""),
            d.get("toplam_oda", ""),
            d.get("toplam_misafir", ""),
            d.get("toplam_tutar", ""),
            now,
        ))


def delete_katilimcilar(rezervasyon_no: str):
    with _conn() as con:
        con.execute("DELETE FROM katilimcilar WHERE rezervasyon_no=?", (rezervasyon_no,))


def insert_katilimci(d: dict):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with _conn() as con:
        con.execute("""
            INSERT INTO katilimcilar
                (rezervasyon_no, oda_no, oda_yatak_tipi, pnr_oda, cinsiyet, tip,
                 isim, soyisim, dogum_tarihi, uyruk, kimlik_no,
                 pasaport_no, pasaport_gecerlilik, pasaport_tip,
                 pasaport_verildi_ulke, pasaport_verilis_tarihi,
                 telefon, binis_noktasi, ekstra_turlar, ek_servis,
                 fiyat_grubu, tutar, pnr, acente, notlar,
                 rezervasyon_notu, acil_durum_bilgisi, guncelleme_tarihi)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            d.get("rezervasyon_no", ""),
            d.get("oda_no", ""),
            d.get("oda_yatak_tipi", ""),
            d.get("pnr_oda", ""),
            d.get("cinsiyet", ""),
            d.get("tip", ""),
            d.get("isim", ""),
            d.get("soyisim", ""),
            d.get("dogum_tarihi", ""),
            d.get("uyruk", ""),
            d.get("kimlik_no", ""),
            d.get("pasaport_no", ""),
            d.get("pasaport_gecerlilik", ""),
            d.get("pasaport_tip", ""),
            d.get("pasaport_verildi_ulke", ""),
            d.get("pasaport_verilis_tarihi", ""),
            d.get("telefon", ""),
            d.get("binis_noktasi", ""),
            d.get("ekstra_turlar", ""),
            d.get("ek_servis", ""),
            d.get("fiyat_grubu", ""),
            d.get("tutar", ""),
            d.get("pnr", ""),
            d.get("acente", ""),
            d.get("notlar", ""),
            d.get("rezervasyon_notu", ""),
            d.get("acil_durum_bilgisi", ""),
            now,
        ))


# ── Okuma sorguları ──────────────────────────────────────────────────────────

def get_all_turlar() -> list[dict]:
    with _conn() as con:
        con.row_factory = sqlite3.Row
        rows = con.execute(
            "SELECT * FROM turlar ORDER BY baslangic_tarihi, service_adi"
        ).fetchall()
    return [dict(r) for r in rows]


def get_turlar_by_baslangic(tarih_str: str) -> list[dict]:
    """tarih_str örneği: '05.07.2026'  (sitenin formatı)"""
    with _conn() as con:
        con.row_factory = sqlite3.Row
        rows = con.execute(
            "SELECT * FROM turlar WHERE baslangic_tarihi LIKE ? ORDER BY service_adi",
            (f"{tarih_str}%",),
        ).fetchall()
    return [dict(r) for r in rows]


def get_all_baslangic_tarihleri() -> list[str]:
    """Dashboard'daki tarih seçicisi için benzersiz kalkış tarihleri."""
    with _conn() as con:
        rows = con.execute(
            "SELECT DISTINCT substr(baslangic_tarihi,1,10) as t "
            "FROM turlar ORDER BY t"
        ).fetchall()
    return [r[0] for r in rows]


def get_katilimcilar(rezervasyon_no: str) -> list[dict]:
    with _conn() as con:
        con.row_factory = sqlite3.Row
        rows = con.execute(
            "SELECT * FROM katilimcilar WHERE rezervasyon_no=? ORDER BY oda_no, tip",
            (rezervasyon_no,),
        ).fetchall()
    return [dict(r) for r in rows]
