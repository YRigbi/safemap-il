# 🛡️ SafeMap IL

אפליקציית מעקב בטחון בזמן אמת עם Google Maps, נתוני פיקוד העורף, קבוצות וגיליון היסטוריה.

---

## Stack
- **Next.js 14** (App Router, TypeScript)
- **Supabase** (PostgreSQL + Auth + Realtime)
- **Google Maps** (JavaScript API + Advanced Markers)
- **NextAuth.js** (Google / Facebook / LinkedIn OAuth)
- **Tailwind CSS**

---

## התקנה מהירה (15 דקות)

### 1. שיבוט והתקנה

```bash
git clone <your-repo>
cd safemap-il
npm install
cp .env.local.example .env.local
```

### 2. Supabase

1. צור פרויקט חדש ב-[supabase.com](https://supabase.com)
2. לך ל-**SQL Editor** והרץ את כל הקובץ `supabase/migrations/001_init.sql`
3. העתק מ-**Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (service_role, סודי!)

### 3. Google Maps

1. לך ל-[console.cloud.google.com](https://console.cloud.google.com)
2. צור פרויקט חדש
3. הפעל את ה-APIs:
   - **Maps JavaScript API**
   - **Geocoding API**
4. צור API Key ב-**Credentials**
5. הגבל את ה-Key ל-HTTP referrers (הדומיין שלך)
6. הדבק ב-`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

> ⚠️ **Map ID**: ב-Google Cloud Console → Google Maps → Map Management → Create Map ID (type: JavaScript) ושמור אותו.  
> עדכן את `mapId` ב-`src/components/GoogleMap.tsx` ל-Map ID שיצרת.

### 4. OAuth Providers

#### Google OAuth
1. ב-Google Cloud Console → **APIs & Services → Credentials → Create OAuth 2.0 Client**
2. Application type: **Web application**
3. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` (+ פרודקשן)
4. העתק `client_id` + `client_secret`

#### Facebook
1. [developers.facebook.com](https://developers.facebook.com) → Create App
2. הוסף **Facebook Login** product
3. Valid OAuth Redirect URIs: `http://localhost:3000/api/auth/callback/facebook`

#### LinkedIn
1. [linkedin.com/developers](https://www.linkedin.com/developers) → Create App
2. Auth redirect URL: `http://localhost:3000/api/auth/callback/linkedin`

### 5. NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```
הדבק כ-`NEXTAUTH_SECRET`

### 6. הרצה מקומית

```bash
npm run dev
```
פתח: [http://localhost:3000](http://localhost:3000)

---

## פריסה ל-Vercel (2 דקות)

```bash
npm install -g vercel
vercel --prod
```
או: גרור את התיקייה ל-[vercel.com/new](https://vercel.com/new)

הוסף את כל משתני הסביבה מ-`.env.local` ב-Vercel → Settings → Environment Variables.

עדכן ב-OAuth providers את redirect URIs לדומיין הפרודקשן:
- `https://your-domain.vercel.app/api/auth/callback/google`
- וכו'

---

## מבנה הפרויקט

```
src/
├── app/
│   ├── page.tsx              ← דף ראשי (מפה + סיידבר)
│   ├── login/page.tsx        ← דף התחברות
│   ├── join/[token]/page.tsx ← הצטרפות לקבוצה
│   └── api/
│       ├── alerts/           ← proxy לפיקוד העורף
│       ├── groups/           ← CRUD קבוצות + join
│       ├── friends/          ← עדכון סטטוס/מיקום
│       ├── history/          ← היסטוריה + מרחב מוגן
│       └── cities/           ← רשימת ערים
├── components/
│   ├── GoogleMap.tsx         ← מפה עם markers
│   └── Sidebar.tsx           ← סיידבר (חברים/היסטוריה/מרחב)
├── lib/
│   ├── supabase.ts           ← clients
│   └── cities.ts             ← helpers + config
└── types/
    └── database.ts           ← TypeScript types
supabase/
└── migrations/001_init.sql   ← Schema מלא + seed ערים
```

---

## פיצ'רים

| פיצ'ר | תיאור |
|-------|-------|
| 🗺️ Google Maps | מפה אמיתית dark mode עם markers לכל חבר |
| 👥 קבוצות | משפחה / עבודה / חברים — סינון המפה לפי קבוצה |
| 🔗 invite link | `/join/[token]` — הצטרפות לקבוצה ללא רישום מראש |
| 🔐 OAuth | Google, Facebook, LinkedIn |
| 📡 פיקוד העורף | polling כל 10 שניות, באנר אדום אם יש התרעה |
| 🕐 migun_time | זמן נכון לפי עיר (15ש׳ שדרות ← 90ש׳ ת"א) |
| 📜 היסטוריה | מיקומי חברים + שלי מ-28 פברואר |
| ⏱️ מרחב מוגן | tracking כניסות, דקות סה"כ, גרף לפי יום |
| 📱 Mobile | responsive, sidebar נשלף |

---

## הערות אבטחה

- `SUPABASE_SERVICE_ROLE_KEY` — **אף פעם לא ב-client-side**
- ה-Oref proxy רץ ב-server-side בלבד (עוקף CORS + geo-block)
- RLS מופעל על כל הטבלאות — משתמש רואה רק קבוצות שהוא חבר בהן
