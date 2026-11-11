# FitBase - Intelligens Edzéstervező Mobilalkalmazás

> **Szakdolgozat**  
> Készítette: **Zajkó Roland**  
> Technológia: **React Native (Expo)** + **Python FastAPI (Render.com)** + **PostgreSQL (Supabase)** + **Groq AI (Llama 3)**

### 1. Opció: Fejlesztői szerver indítása (Expo Metro)

Kattintson duplán a projekt gyökerében található **`start.bat`** fájlra (vagy adja ki a parancssorban az `npm install && npx expo start --dev-client` parancsot)!

A szkript automatikusan elvégzi a szükséges lépéseket:
1. Ellenőrzi a felhős backend elérhetőségét.
2. Szükség esetén telepíti a Node.js csomagokat (`npm install`).
3. Elindítja az **Expo Metro bundlert**, amely közvetlenül a felhős Render + Supabase backendhez csatlakozik.
4. Android emulátor indításához nyomjon egy `a` betűt a megnyíló konzolban.

---
A projekt úgy lett kialakítva,hogy egyböl müködöképes , mivel a backend és az adatbázis élesben, felhőben fut:
- **Felhős Backend:** [Render.com](https://render.com) (`https://fitbase-backend.onrender.com`)
- **Felhős Adatbázis:** [Supabase](https://supabase.com) (menedzselt felhős PostgreSQL)

A publikus backend API Swagger dokumentációja közvetlenül megtekinthető:  
👉 **[https://fitbase-backend.onrender.com/docs](https://fitbase-backend.onrender.com/docs)**

### 2. Opció: Mobilalkalmazás azonnali kipróbálása (Kész APK)

 Nem szükséges Android fejlesztői környezetet konfigurálniuk a gépen.

1. Töltse le a kész **`FitBase.apk`** fájlt a `builds/` mappából (vagy futtassa a **`build-apk.bat`** fájlt új build készítéséhez).
2. A `builds/FitBase.apk` fájlt közvetlenül húzza rá egy Android emulátorra vagy telepítse fel egy Androidos okostelefonra.
3. Az alkalmazás azonnal a felhős adatbázishoz és API-hoz kapcsolódik.

---

## Architektúra és Technológiák

- **Kliens (Frontend):**
  - **Keretrendszer:** React Native 0.86, Expo 57 (Expo Router fájl-alapú navigáció)
  - **Nyelv:** TypeScript, szigorú típusbiztonság és objektumorientált (OOP) szerviz- és repository réteg
  - **Hitelesítés & Biztonság:** Natív Google Sign-In és hardveresen védett tokenkezelés (`expo-secure-store`)
  - **Dizájn:** Teljesen egyedi sötét/neon atlétikai felület, rendszer-navigációhoz adaptív mérőszámok (`NavigationBarMetrics`)
- **Szerver (Backend):**
  - **Hosztolás:** [Render.com](https://render.com) felhőszolgáltatás
  - **Keretrendszer:** Python 3.10+, FastAPI aszinkron RESTful architektúra
  - **Adatbázis:** [Supabase](https://supabase.com) menedzselt felhős PostgreSQL (SQLAlchemy 2.0 ORM, Alembic migrációk, pooler-barát kapcsolatkezelés)
  - **AI Integráció és Edző Rendszer:** Redundáns többmodelles architektúra Google Gemini 2.0 Flash és Groq LPU API motorral, automatikus hibatűréssel (Failover & Exponential Backoff), konzultatív tervezéssel és granuláris adatbázis-módosításokkal.
  - **Biztonság:** JWT Bearer token autentikáció (Argon2 / BCrypt jelszótitkosítás, szigorú felhasználói adatelkülönítés)

---

## Helyi backend fejlesztés (Opcionális)

Amennyiben a backend forráskódját helyileg szeretné futtatni vagy továbbfejleszteni:

1. Lépjen be a `backend/` mappába:
   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\pip install -r requirements.txt
   ```
2. Másolja le a `.env.example` fájlt `.env` névre, és állítsa be a `DATABASE_URL` (Supabase kapcsolat) és `JWT_SECRET` értékeket.
3. Indítsa el a FastAPI fejlesztői szervert:
   ```powershell
   .\.venv\Scripts\fastapi dev app/main.py --host 0.0.0.0
   ```

---

## Adatforrások

Exercise data by [RepDB](https://repdb.co) – 650 gyakorlat, ingyenes verzió.
