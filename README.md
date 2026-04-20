# 🍲 קסרולה — Casserole

> **Private catering management platform · מערכת ניהול קייטרינג פרטית**
>
> Hebrew RTL · Invite-only · Single client

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)

---

## 📌 About · אודות

**EN** — Casserole is a full ERP platform built exclusively for catering business operations. It centralizes event management, recipes, inventory, production and deliveries in a fully Hebrew (RTL) interface. Access is **invite-only** — no public sign-up.

**HE** — קסרולה היא מערכת ERP מלאה שנבנתה במיוחד לניהול תפעולי של עסק קייטרינג. המערכת מרכזת ניהול אירועים, מתכונים, מחסן, ייצור ומשלוחים בממשק עברי מלא (RTL). הגישה **בהזמנה בלבד** — אין הרשמה פומבית.

---

## ✨ Features · פונקציונליות

### 🔐 Auth · אימות
**EN** — Invite-only access, secure password reset, role-based permissions (admin / employee), limited-time demo mode.

**HE** — גישה בהזמנה בלבד, איפוס סיסמה מאובטח, הרשאות לפי תפקיד (מנהל / עובד), מצב דמו מוגבל בזמן.

### 📊 Dashboard · לוח בקרה
**EN** — Real-time KPIs, stock alerts, upcoming events, today's deliveries, revenue charts.

**HE** — מדדי זמן אמת, התראות מלאי, אירועים קרובים, משלוחי היום, גרפי הכנסות.

### 📅 Events · אירועים
**EN** — Calendar + list views, multi-department planning, full status pipeline, PDF quotes & invoices.

**HE** — לוח שנה + רשימה, תכנון רב-מחלקתי, מעקב סטטוסים מלא, הצעות מחיר וחשבוניות PDF.

`pending → confirmed → in-progress → ready → delivered`

### 📖 Recipes · מתכונים
**EN** — Recipe library with portion scaling, cost calculation, warehouse-linked ingredients.

**HE** — ספריית מתכונים עם שינוי מנות, חישוב עלויות, מצרכים מקושרים למחסן.

### 🏭 Warehouse · מחסן
**EN** — Stock tracking, supplier management, stock movements, auto purchase list.

**HE** — מעקב מלאי, ניהול ספקים, תנועות מלאי, רשימת קנייה אוטומטית.

### 📦 Reserve · רזרבה
**EN** — Prepared product stock with expiry tracking, production scheduling.

**HE** — מלאי מוצרים מוכנים עם מעקב תפוגה, תזמון ייצור.

### 👨‍🍳 Production · ייצור
**EN** — Per-department task tracking, assignment, printable production sheets.

**HE** — מעקב משימות פר מחלקה, הקצאה, הדפסת דפי ייצור.

### 🚚 Deliveries · משלוחים
**EN** — Full delivery timeline, photo proof, PDF delivery slip.

**HE** — ציר זמן משלוח, הוכחת מסירה בתמונה, תעודת משלוח PDF.

### 🛍️ Catalog · קטלוג
**EN** — Product listings with pricing, department classification, recipe link.

**HE** — רשימת מוצרים עם תמחור, סיווג מחלקתי, קישור למתכון.

### 🛡️ Admin · מנהל
**EN** — User management, demo access tokens, audit logs.

**HE** — ניהול משתמשים, טוקני גישה לדמו, יומני ביקורת.

---

## 🏗️ Tech Stack · טכנולוגיות

| Layer | Technology |
|---|---|
| UI | React 18 + TypeScript + Tailwind CSS + shadcn/ui |
| Build | Vite 6 |
| Backend | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Serverless | Deno Edge Functions |
| Email | Resend |
| Deployment | Lovable |

---

## 🚀 Local Setup · הגדרה מקומית

```bash
git clone https://github.com/belhassen-raphael99/kitchenflow-rtl-magic.git
cd kitchenflow-rtl-magic
npm install --legacy-peer-deps
cp .env.example .env   # fill in your Supabase keys
npx vite
```

**.env**
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 🗺️ Roadmap MVP 2

- 💳 Integrated invoicing · חשבונאות משולבת
- 👥 Advanced client management · ניהול לקוחות מתקדם
- 📱 Mobile PWA · אפליקציה מובייל
- 📢 Real-time notifications · התראות זמן אמת
- 👷 HR scheduling · תכנון כוח אדם
- 📊 Reports & exports · דוחות וייצוא
- 🛒 Supplier purchase module · מודול רכש

---

## 👨‍💻 Developer · מפתח

**Raphael Belhassen**
- LinkedIn : [raphael-belhassen](https://www.linkedin.com/in/raphael-belhassen-85a152283/)
- Email : [contact.zyflows@gmail.com](mailto:contact.zyflows@gmail.com)

---

*Private platform — invite-only access. · פלטפורמה פרטית — גישה בהזמנה בלבד.*
