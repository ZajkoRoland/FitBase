@echo off
setlocal enabledelayedexpansion
title FitBase - APK Fordito es Telepito
color 0B

echo ======================================================================
echo                  FITBASE - TELEPITO APK KESZITESE
echo ======================================================================
echo.

cd /d "%~dp0"

REM 1. Node modulok ellenorzese
if not exist "node_modules" (
    echo [1/4] Node modulok telepitese...
    call npm install
) else (
    echo [1/4] Node modulok ellenorizve.
)

REM 2. Android nativ projekt ellenorzese (Expo Prebuild)
if not exist "android\gradlew.bat" (
    echo.
    echo [2/4] Android nativ projekt hianyzik.
    echo       Expo prebuild futtatasa folyamatban...
    call npx expo prebuild --platform android --clean
    if !ERRORLEVEL! neq 0 (
        echo [HIBA] Az Expo prebuild nem tudta legeneralni az android mappat.
        pause
        exit /b 1
    )
) else (
    echo [2/4] Android nativ projekt elerheto.
)

REM 3. Android SDK beallitasa
set "SDK_DIR="
if exist "%LOCALAPPDATA%\Android\Sdk" set "SDK_DIR=%LOCALAPPDATA%\Android\Sdk"
if not defined SDK_DIR if defined ANDROID_HOME if exist "%ANDROID_HOME%" set "SDK_DIR=%ANDROID_HOME%"

if defined SDK_DIR (
    set "SDK_DIR_PROP=!SDK_DIR:\=/!"
    echo sdk.dir=!SDK_DIR_PROP!> android\local.properties
)

REM Regi build es cache torlese a tiszta forditas erdekeben
if exist "android\app\build\outputs\apk\release\app-release.apk" (
    del /f /q "android\app\build\outputs\apk\release\app-release.apk" >nul 2>&1
)
if exist "android\app\build\generated\assets\createBundleReleaseJsAndAssets" (
    rd /s /q "android\app\build\generated\assets\createBundleReleaseJsAndAssets" >nul 2>&1
)

echo.
echo [3/4] Friss JavaScript csomag es APK forditas folyamatban...
echo       (Ez a folyamat elso alkalommal 2-4 percet is igenybe vehet)...
cd android
call .\gradlew.bat app:assembleRelease --no-daemon
cd ..

REM A siker legbiztosabb jele, hogy elkeszult-e az app-release.apk
if not exist "android\app\build\outputs\apk\release\app-release.apk" (
    echo.
    echo ======================================================================
    echo   [HIBA] Az APK fajl nem jott letre.
    echo   Ellenorizd a fenti Gradle uzeneteket.
    echo ======================================================================
    if "%1"=="" pause
    exit /b 1
)

if not exist "builds" mkdir builds
copy /y "android\app\build\outputs\apk\release\app-release.apk" "builds\FitBase.apk" >nul

echo.
echo ======================================================================
echo   SIKER: A legfrissebb APK elkeszult.
echo   builds\FitBase.apk
echo ======================================================================
echo.

REM 4. ADB es automatikus telepites
echo [4/4] Csatlakoztatott emulator / eszkoz keresese...

set "ADB_CMD="
where adb >nul 2>nul && set "ADB_CMD=adb"
if not defined ADB_CMD if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" set "ADB_CMD=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
if not defined ADB_CMD if defined ANDROID_HOME if exist "%ANDROID_HOME%\platform-tools\adb.exe" set "ADB_CMD=%ANDROID_HOME%\platform-tools\adb.exe"

if defined ADB_CMD (
    "%ADB_CMD%" get-state >nul 2>nul
    if !ERRORLEVEL! equ 0 (
        echo [Eszkoz csatlakoztatva] FitBase.apk telepitese folyamatban...
        "%ADB_CMD%" install -r "builds\FitBase.apk"
        if !ERRORLEVEL! neq 0 (
            echo.
            echo [FIGYELEM] Kozvetlen frissites sikertelen
            echo Regi verzio tiszta eltavolitasa es ujratelepites folyamatban...
            "%ADB_CMD%" uninstall com.emperor98s.fitbase >nul 2>&1
            "%ADB_CMD%" install "builds\FitBase.apk"
        )
        if !ERRORLEVEL! equ 0 (
            echo.
            echo [SIKER] Az uj FitBase verzio sikeresen feltelepult a keszulekre.
            echo Alkalmazas inditasa az eszkozon...
            "%ADB_CMD%" shell monkey -p com.emperor98s.fitbase -c android.intent.category.LAUNCHER 1 >nul 2>nul
        ) else (
            echo [FIGYELEM] Az automatikus telepites nem sikerult.
            echo Torold le kezzel az elozo FitBase appot a telefonrol/emulatorrol, majd huzd ra a builds\FitBase.apk fajlt.
        )
    ) else (
        echo [INFO] Nincs aktivan futo emulator vagy USB-n csatlakoztatott telefon.
        echo.
        echo Telepites lepesei:
        echo   1. Inditsd el az Android emulatort.
        echo   2. Ha mar fent van a FitBase, tavolitsd el a regi verziojat.
        echo   3. Egyszeruen huzd ra a builds\FitBase.apk fajlt az emulator ablakara.
    )
) else (
    echo [INFO] ADB parancssori eszkoz nem talalhato a PATH-ban.
    echo A builds\FitBase.apk fajlt kezzel huzd ra az emulator ablakara.
)

echo.
if "%1"=="" pause
