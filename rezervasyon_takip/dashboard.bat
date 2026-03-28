@echo off
chcp 65001 > nul
echo ============================================
echo   DASHBOARD AÇILIYOR
echo ============================================
echo.
echo Tarayıcınızda http://localhost:8501 açılacak.
echo Bu pencereyi kapatmayın (arka planda çalışır).
echo.
streamlit run app.py --server.headless true
pause
