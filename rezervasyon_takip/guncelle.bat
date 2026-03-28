@echo off
chcp 65001 > nul
echo ============================================
echo   VERİ GÜNCELLEME BAŞLIYOR
echo ============================================
echo.
echo Tarayıcı açılacak ve siteye otomatik giriş yapılacak.
echo Lütfen bekleyin...
echo.
echo İptal etmek için bu pencereyi kapatabilirsiniz.
echo.

REM Argümanlar: gecmis_gun ileri_gun
REM Örnek: python scraper.py 7 180
REM (Son 7 gün + ileriki 180 günlük rezervasyonları çek)
python scraper.py 7 180

echo.
if errorlevel 1 (
    echo HATA oluştu! scraper.log dosyasını inceleyin.
    echo screenshots/ klasörüne de bakabilirsiniz.
) else (
    echo VERİ BAŞARIYLA GÜNCELLENDİ!
)
echo.
pause
