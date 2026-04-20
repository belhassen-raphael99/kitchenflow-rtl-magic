# 🍲 קסרולה — Casserole

> **Plateforme ERP privée de gestion de catering · מערכת ERP פרטית לניהול קייטרינג**
>
> Hebrew RTL · Invite-only · Single client

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Deployed on Lovable](https://img.shields.io/badge/Deployed-Lovable-FF6B6B?style=flat-square)](https://lovable.app)

---

## 📌 About · אודות

**EN** — Casserole is a full ERP system built exclusively for the operational management of a catering business. It centralizes event management, recipes, inventory, production and deliveries in a fully Hebrew (RTL) interface. Access is **invite-only** — no public sign-up.

**HE** — קסרולה היא מערכת ERP מלאה שנבנתה במיוחד לניהול תפעולי של עסק קייטרינג. המערכת מרכזת ניהול אירועים, מתכונים, מחסן, ייצור ומשלוחים בממשק עברי מלא (RTL). הגישה **בהזמנה בלבד** — אין הרשמה פומבית.

---

## ✨ Features · פונקציונליות

### 🔐 Auth & Security · אימות ואבטחה

| EN | HE |
|---|---|
| Email + password login | כניסה עם אימייל וסיסמה |
| Secure reset link (anti-enumeration) | קישור איפוס מאובטח (אנטי-ספירה) |
| Admin invitation via signed Supabase link | הזמנת משתמשים דרך קישור חתום |
| Roles: `admin` · `employee` · `demo` | תפקידים: מנהל · עובד · דמו |
| User impersonation for support | התחזות משתמש לתמיכה |
| Full audit log | יומן ביקורת מלא |
| Server-side rate limiting | הגבלת קצב בצד השרת |

### 📊 Dashboard · לוח בקרה

**EN** — Real-time KPIs (events, guests, revenue, stock), low/critical stock alerts, upcoming events, today's deliveries, revenue trend charts.

**HE** — מדדי זמן אמת (אירועים, אורחים, הכנסות, מלאי), התראות מלאי נמוך, אירועים קרובים, משלוחי היום, גרפי מגמות הכנסות.

### 📅 Agenda & Events · סדר יום ואירועים

**EN** — Calendar + list views, creation wizard (client, date, menu, guests), multi-department planning (Kitchen · Bakery · Pastry), status pipeline, PDF quote & invoice generation, priority import from PDF.

**HE** — תצוגת לוח שנה + רשימה, אשף יצירת אירוע (לקוח, תאריך, תפריט, אורחים), תכנון רב-מחלקתי (מטבח · מאפייה · קינוחים), מעקב סטטוסים, הפקת הצעות מחיר וחשבוניות PDF, ייבוא אירועים מ-PDF.

**Status pipeline:** `pending` → `confirmed` → `in-progress` → `ready` → `delivered`

### 📖 Recipes · מתכונים

**EN** — Full recipe library, warehouse-linked ingredients (auto cost), portion scaling (×1/2/3), cost price + selling price per portion.

**HE** — ספריית מתכונים מלאה, מצרכים מקושרים למחסן (עלות אוטומטית), שינוי מנות (×1/2/3), מחיר עלות + מחיר מכירה למנה.

### 🏭 Warehouse · מחסן

**EN** — Stock tracking with alert thresholds, supplier management, price history, stock movements, auto purchase list generation.

**HE** — מעקב מלאי עם סף התראה, ניהול ספקים, היסטוריית מחירים, תנועות מלאי, יצירת רשימת קנייה אוטומטית.

### 📦 Reserve · רזרבה

**EN** — Prepared product stock with expiry dates, storage types (Freezer / Fridge / Dry), weekly production schedule, auto expiry detection.

**HE** — מלאי מוצרים מוכנים עם תאריכי תפוגה, סוגי אחסון (מקפיא / מקרר / יבש), לוח ייצור שבועי, זיהוי אוטומטי של מוצרים פגי תוקף.

### 👨‍🍳 Production · ייצור

**EN** — Per-department task dashboard, assignment & tracking (`pending` → `in-progress` → `completed`), events ↔ reserve integration, printable production sheets.

**HE** — לוח משימות פר מחלקה, הקצאה ומעקב (`ממתין` → `בתהליך` → `הושלם`), אינטגרציה אירועים ↔ רזרבה, הדפסת דפי ייצור.

### 🚚 Deliveries · משלוחים

**EN** — Full delivery timeline, photo proof of delivery, PDF delivery slip, address + contact management.

**HE** — ציר זמן מלא של משלוח, הוכחת משלוח בתמונה, תעודת משלוח PDF, ניהול כתובות ואנשי קשר.

### 🛍️ Catalog · קטלוג

**EN** — Product listings (internal/client names), price, size, department, active status, recipe link.

**HE** — רשימת מוצרים (שמות פנימי/לקוח), מחיר, גודל, מחלקה, סטטוס פעיל, קישור למתכון.

### 🛡️ Admin Panel · פאנל מנהל

**EN** — User management (invite, roles, delete), demo token generation, user impersonation, audit logs.

**HE** — ניהול משתמשים (הזמנה, תפקידים, מחיקה), יצירת טוקני דמו, התחזות משתמש, יומני ביקורת.

---

## 🏗️ Architecture · ארכיטקטורה

```
Frontend (React + Vite)
       │
       ▼
Supabase Auth ──── JWT ────► Supabase PostgreSQL (RLS)
       │                           │
       ▼                           ▼
Edge Functions (Deno)        20+ Business tables
├── invite-user              (events, recipes, warehouse,
├── demo-auto-login           reserve, production, delivery…)
├── impersonate-user
├── delete-user
└── generate-delivery-slip
```

| Layer | Technology |
|---|---|
| UI | React 18 + TypeScript + Tailwind CSS + shadcn/ui |
| Build | Vite 6 |
| Backend | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth |
| Edge Functions | Deno (TypeScript) |
| Email | Resend |
| Deployment | Lovable |

---

## 🔒 Security · אבטחה

| EN | HE |
|---|---|
| Zero passwords in emails | אפס סיסמאות במיילים |
| Fail-closed: no role = instant sign-out | סגור-כשל: אין תפקיד = ניתוק מיידי |
| Atomic cleanup on invite failure | ניקוי אטומי בכשל הזמנה |
| Anti-enumeration on password reset | אנטי-ספירה באיפוס סיסמה |
| Server-side rate limiting on all Edge Functions | הגבלת קצב שרת על כל Edge Functions |
| Sensitive tokens never in localStorage | טוקנים רגישים לא ב-localStorage |

---

## 🚀 Local Setup · הגדרה מקומית

```bash
# Clone the repo
git clone https://github.com/belhassen-raphael99/kitchenflow-rtl-magic.git
cd kitchenflow-rtl-magic

# Install dependencies
npm install --legacy-peer-deps

# Configure environment
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Start dev server
npx vite
```

**.env**
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Supabase Edge Functions secrets:**
```
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Casserole <noreply@example.com>
ALLOWED_ORIGIN=https://your-domain.com
```

---

## 📁 Project Structure · מבנה הפרויקט

```
src/
├── components/
│   ├── auth/        # Route guards (ProtectedRoute, AdminRoute)
│   ├── layout/      # AppLayout, Sidebar, DemoBanner
│   ├── pages/       # One file per page
│   ├── settings/    # Settings tabs
│   └── ui/          # shadcn/ui components
├── context/         # AuthContext, AppContext
├── hooks/           # useAuth, useImpersonation
├── integrations/
│   └── supabase/    # Client + generated types
└── App.tsx          # React Router v6 routing

supabase/
├── functions/       # Deno Edge Functions
└── migrations/      # Timestamped SQL migrations
```

---

## 🗺️ Roadmap MVP 2

See [CLAUDE.md](./CLAUDE.md) for the full feature roadmap · ראה [CLAUDE.md](./CLAUDE.md) לרשימת הפיצ'רים המתוכננים.

- 💳 Integrated invoicing · חשבונאות משולבת
- 👥 Advanced client management · ניהול לקוחות מתקדם
- 📱 Mobile PWA for kitchen staff · PWA מובייל לצוות המטבח
- 📢 Real-time notifications (push + SMS) · התראות זמן אמת
- 👷 HR scheduling per event · תכנון כוח אדם לפי אירוע
- 📊 Reports & Excel/PDF exports · דוחות וייצוא
- 🛒 Supplier purchase module · מודול רכש ספקים

---

## 👨‍💻 Developer · מפתח

**Raphael Belhassen**
- LinkedIn : [raphael-belhassen](https://www.linkedin.com/in/raphael-belhassen-85a152283/)
- Email : [contact.zyflows@gmail.com](mailto:contact.zyflows@gmail.com)

---

*Private platform — invite-only access. · פלטפורמה פרטית — גישה בהזמנה בלבד.*
