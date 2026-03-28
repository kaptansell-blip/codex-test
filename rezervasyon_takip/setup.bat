@echo off
chcp 65001 > nul
echo ============================================
echo   REZERVASYON TAKİP - İLK KURULUM
echo ============================================
echo.

REM Gerekli kütüphaneleri yükle
echo [1/3] Python kütüphaneleri yükleniyor...
pip install -r requirements.txt
if errorlevel 1 (
    echo HATA: pip ile yükleme başarısız!
    pause
    exit /b 1
)

REM Playwright tarayıcısını indir
echo.
echo [2/3] Playwright Chromium tarayıcısı indiriliyor...
python -m playwright install chromium
if errorlevel 1 (
    echo HATA: Playwright kurulumu başarısız!
    pause
    exit /b 1
)

REM Screenshots klasörü
echo.
echo [3/3] Klasörler oluşturuluyor...
if not exist screenshots mkdir screenshots

echo.
echo ============================================
echo   KURULUM TAMAMLANDI!
echo ============================================
echo.
echo Sonraki adım:
echo   1. config.py dosyasını açın
echo   2. KULLANICI_ADINIZ ve SIFRENIZ kısımlarını doldurun
echo   3. guncelle.bat ile veriyi çekin
echo   4. dashboard.bat ile uygulamayı açın
echo.
pause
