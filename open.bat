@echo off
cd /d "%~dp0"
echo Launching Letter to Osagyefo...
echo.
echo Opening in your default browser...
timeout /t 2
start http://localhost:3000/ || start index.html
echo.
echo If the page doesn't open, visit: http://localhost:3000/
echo Or open directly: file:///c:/Users/Paragon NP/Desktop/letter-to-osagyefo/index.html
pause
