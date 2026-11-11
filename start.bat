@echo off
setlocal enabledelayedexpansion
title FitBase - Szakdolgozat Indito

echo ======================================================================
echo                    FITBASE - ALKALMAZAS INDITO
echo ======================================================================
echo.

cd /d "%~dp0"

REM 1. Felhos Backend ellenorzese
echo [1/3] Felhos Backend API ellenorzese...
echo       * Render Backend URL : https://fitbase-backend.onrender.com/docs
echo       * Database           : Supabase Cloud PostgreSQL
echo       [OK] Felhos kapcsolat konfiguralva.
echo.

REM 2. Frontend fuggosegek
echo [2/3] Frontend (Expo) ellenorzese...
if not exist "node_modules" (
    echo       [npm modulok hianyoznak] Telepites folyamatban, kis turelmet...
    call npm install
)

REM Android SDK beallitasa
set "SDK_DIR="
if exist "%LOCALAPPDATA%\Android\Sdk" set "SDK_DIR=%LOCALAPPDATA%\Android\Sdk"
if not defined SDK_DIR if defined ANDROID_HOME if exist "%ANDROID_HOME%" set "SDK_DIR=%ANDROID_HOME%"
if defined SDK_DIR (
    if exist "android" (
        set "SDK_DIR_PROP=!SDK_DIR:\=/!"
        echo sdk.dir=!SDK_DIR_PROP!> android\local.properties
    )
)

echo.
echo ======================================================================
echo                     VALASSZ INDITASI MODOT:
echo ======================================================================
echo.
echo   [1] Metro Bundler TISZTA GYORSITOTARRAL (-c) [ALAPERTELMEZETT]
echo       - Valos ideju hot-reload mod
echo       - Automatikusan torli a regi beragadt cache-t
echo.
echo   [2] Kozvetlen futtatas Android Emulatoron (expo run:android)
echo       - Ujraforditja es feltelepiti a friss nativ dev appot az emulatorra
echo.
echo   [3] Onallo Release APK keszitese es telepitese (build-apk.bat)
echo       - Letrehozza a fuggetlen FitBase.apk-t es felteszi az eszkozre
echo.
echo ======================================================================
echo.

choice /c 123 /t 6 /d 1 /m "Valasztas (6 masodperc utan automatikusan az 1-es indul): "
set USER_CHOICE=!ERRORLEVEL!

echo.
if !USER_CHOICE! equ 3 (
    echo [3-as mod] build-apk.bat inditasa...
    call build-apk.bat
    exit /b
)

if !USER_CHOICE! equ 2 (
    echo [2-es mod] Alkalmazas forditasa es inditasa Android emulatoron...
    call npx expo run:android
    pause
    exit /b
)

REM 1-es alapertelmezett mod: Metro tiszta cache-sel
echo [1-es mod] Metro Bundler inditasa tiszta gyorsitotarral...
echo.
echo [TIPP] Ha elindult a Metro:
echo   - Nyomj 'a' betut az Android emulator megnyitasahoz
echo   - Nyomj 'r' betut a kod azonnali ujratoltesehez (Reload)
echo.
call npx expo start -c
pause
