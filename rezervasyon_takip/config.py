import os

# ─────────────────────────────────────────────
#  Giriş Bilgileri  (buraya kendi bilgilerinizi yazın)
# ─────────────────────────────────────────────
USERNAME = os.environ.get("TNB_USERNAME", "KULLANICI_ADINIZ")
PASSWORD = os.environ.get("TNB_PASSWORD", "SIFRENIZ")

# ─────────────────────────────────────────────
#  Uygulama Ayarları
# ─────────────────────────────────────────────
LOGIN_URL  = "https://panel.touchandbook.com/Login.aspx"
DB_PATH    = os.path.join(os.path.dirname(__file__), "rezervasyonlar.db")

# Sadece bu tur tiplerini çek ("Gemi", "Konaklamalı Tur" veya "" = hepsi)
FILTRE_TUR_TIPI = "Gemi"

# Tarayıcıyı görünür mü çalıştır?  (True = görünür, False = arka planda)
HEADLESS = False
