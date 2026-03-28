"""
Streamlit Dashboard — Gemi Tur Rezervasyon Takibi
Çalıştır: streamlit run app.py
"""

import pandas as pd
import streamlit as st
from datetime import date, datetime

import database as db

# ── Sayfa yapılandırması ─────────────────────────────────────────────────────
st.set_page_config(
    page_title="Rezervasyon Takibi",
    page_icon="🚢",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Özel CSS (minimal, temiz görünüm) ────────────────────────────────────────
st.markdown("""
<style>
    .metric-box {
        background: #f0f4f8;
        border-radius: 10px;
        padding: 16px 20px;
        text-align: center;
    }
    .metric-label { font-size: 13px; color: #666; margin-bottom: 4px; }
    .metric-value { font-size: 28px; font-weight: bold; color: #1a1a2e; }
    .tur-baslik {
        background: linear-gradient(90deg, #c0392b, #e74c3c);
        color: white;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 15px;
        font-weight: bold;
        margin-bottom: 8px;
    }
    hr { margin: 8px 0; }
</style>
""", unsafe_allow_html=True)


# ── Başlık ───────────────────────────────────────────────────────────────────
st.markdown("## 🚢 Gemi Tur Rezervasyon Takibi")
st.markdown("---")


# ── Sol panel (Sidebar) ──────────────────────────────────────────────────────
with st.sidebar:
    st.header("🔍 Filtrele")

    tum_tarihler = db.get_all_baslangic_tarihleri()

    mod = st.radio("Görünüm", ["Tarihe Göre", "Tüm Rezervasyonlar"], index=0)

    if mod == "Tarihe Göre":
        if tum_tarihler:
            # Tarih seçicisi: veritabanındaki gerçek tarihleri listele
            tarih_secenekler = sorted(tum_tarihler, reverse=True)
            secili_tarih = st.selectbox(
                "Kalkış Tarihi",
                tarih_secenekler,
                format_func=lambda t: t if t else "—",
            )
        else:
            st.date_input("Kalkış Tarihi", value=date.today(), key="date_pick")
            secili_tarih = st.session_state.date_pick.strftime("%d.%m.%Y")

    st.markdown("---")
    st.caption(
        "Veriyi güncellemek için `guncelle.bat` dosyasını çalıştırın.\n\n"
        "Son güncelleme:"
    )
    turlar_hepsi = db.get_all_turlar()
    if turlar_hepsi:
        son_guncelleme = max(
            t.get("guncelleme_tarihi", "") for t in turlar_hepsi
        )
        st.caption(f"🕐 {son_guncelleme}")


# ── Veri yükleme ─────────────────────────────────────────────────────────────
if mod == "Tüm Rezervasyonlar":
    turlar = turlar_hepsi
else:
    if tum_tarihler:
        turlar = db.get_turlar_by_baslangic(secili_tarih)
    else:
        turlar = []


# ── İçerik ───────────────────────────────────────────────────────────────────
if not turlar:
    if not turlar_hepsi:
        st.warning(
            "⚠️ Henüz veri yok.\n\n"
            "`guncelle.bat` dosyasını çalıştırıp veriyi çekin."
        )
    else:
        st.info(
            f"Seçili tarihte ({secili_tarih}) kalkış yapan tur bulunamadı."
        )
    st.stop()


# ── Özet metrik kartları ─────────────────────────────────────────────────────
toplam_tur = len(turlar)

def safe_int(val):
    try:
        return int(str(val).split()[0])
    except Exception:
        return 0

toplam_oda = sum(safe_int(t.get("toplam_oda", 0)) for t in turlar)
toplam_misafir = sum(safe_int(t.get("toplam_misafir", 0)) for t in turlar)

col1, col2, col3 = st.columns(3)
with col1:
    st.markdown(
        f'<div class="metric-box"><div class="metric-label">Tur Sayısı</div>'
        f'<div class="metric-value">{toplam_tur}</div></div>',
        unsafe_allow_html=True,
    )
with col2:
    st.markdown(
        f'<div class="metric-box"><div class="metric-label">Toplam Oda</div>'
        f'<div class="metric-value">{toplam_oda}</div></div>',
        unsafe_allow_html=True,
    )
with col3:
    st.markdown(
        f'<div class="metric-box"><div class="metric-label">Toplam Misafir</div>'
        f'<div class="metric-value">{toplam_misafir}</div></div>',
        unsafe_allow_html=True,
    )

st.markdown("<br>", unsafe_allow_html=True)


# ── Her tur için detay bloğu ─────────────────────────────────────────────────
SUTUN_ETIKETI = {
    "oda_no":              "Oda No",
    "oda_yatak_tipi":      "Oda Tipi",
    "pnr_oda":             "PNR (Oda)",
    "cinsiyet":            "Cinsiyet",
    "tip":                 "Tip",
    "isim":                "İsim",
    "soyisim":             "Soyisim",
    "dogum_tarihi":        "Doğum Tarihi",
    "uyruk":               "Uyruk",
    "kimlik_no":           "Kimlik No",
    "pasaport_no":         "Pasaport No",
    "pasaport_gecerlilik": "Pas. Geçerlilik",
    "telefon":             "Telefon",
    "binis_noktasi":       "Biniş Noktası",
    "fiyat_grubu":         "Kabin Tipi",
    "tutar":               "Tutar",
    "pnr":                 "PNR",
    "acente":              "Acente",
    "rezervasyon_notu":    "Rezervasyon Notu",
}

GOSTERILECEK = list(SUTUN_ETIKETI.keys())

for tur in turlar:
    rez_no      = tur["rezervasyon_no"]
    service_adi = tur.get("service_adi", "—")
    bas_tarih   = tur.get("baslangic_tarihi", "")
    bit_tarih   = tur.get("bitis_tarihi", "")
    tur_kodu    = tur.get("tur_kodu", "")
    saglayici   = tur.get("saglayici", "")
    misafir     = tur.get("toplam_misafir", "")
    oda         = tur.get("toplam_oda", "")
    tutar       = tur.get("toplam_tutar", "")
    guncelleme  = tur.get("guncelleme_tarihi", "")

    baslik = (
        f"🛳️  {service_adi}  │  "
        f"{bas_tarih} → {bit_tarih}  │  "
        f"{oda} Oda  │  {misafir} Misafir"
    )

    with st.expander(baslik, expanded=True):
        # Tur meta bilgileri
        mc1, mc2, mc3, mc4 = st.columns(4)
        mc1.markdown(f"**Rezervasyon No**  \n{rez_no}")
        mc2.markdown(f"**Tur Kodu**  \n{tur_kodu}")
        mc3.markdown(f"**Sağlayıcı**  \n{saglayici}")
        mc4.markdown(f"**Tutar**  \n{tutar}")

        st.markdown(f"<small>Son güncelleme: {guncelleme}</small>", unsafe_allow_html=True)
        st.markdown("---")

        # Katılımcılar
        katilimcilar = db.get_katilimcilar(rez_no)
        if not katilimcilar:
            st.info("Katılımcı verisi henüz yüklenmedi.")
        else:
            df = pd.DataFrame(katilimcilar)

            # Yalnızca var olan sütunları al
            goster = [c for c in GOSTERILECEK if c in df.columns]
            df_goster = df[goster].rename(columns=SUTUN_ETIKETI)

            # Kabin tipi özeti (yan özet)
            if "fiyat_grubu" in df.columns:
                ozet = (
                    df.groupby("fiyat_grubu")
                    .agg(Oda=("oda_no", "nunique"), Misafir=("isim", "count"))
                    .reset_index()
                    .rename(columns={"fiyat_grubu": "Kabin Tipi"})
                )
                tc1, tc2 = st.columns([2, 5])
                with tc1:
                    st.markdown("**Kabin Özeti**")
                    st.dataframe(ozet, hide_index=True, use_container_width=True)
                with tc2:
                    st.markdown(f"**Katılımcılar** ({len(df)} kişi)")
                    st.dataframe(df_goster, hide_index=True, use_container_width=True)
            else:
                st.dataframe(df_goster, hide_index=True, use_container_width=True)
