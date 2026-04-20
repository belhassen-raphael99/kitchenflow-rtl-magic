# 🍲 קסרולה — Casserole

> **Plateforme ERP privée de gestion de catering** — Hebrew RTL · Invite-only · Single client

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Deployed on Lovable](https://img.shields.io/badge/Deployed-Lovable-FF6B6B?style=flat-square)](https://lovable.app)

---

## 📌 À propos

**Casserole** est un système ERP complet conçu exclusivement pour la gestion opérationnelle d'une entreprise de catering. Il centralise la gestion des événements, des recettes, du stock, de la production et des livraisons dans une interface entièrement en hébreu (RTL).

L'accès est **sur invitation uniquement** — aucune inscription publique. Chaque utilisateur reçoit un lien d'invitation sécurisé par email.

---

## ✨ Fonctionnalités

### 🔐 Authentification & Sécurité
- Connexion email + mot de passe
- Réinitialisation par lien sécurisé (anti-énumération)
- Invitation admin via lien signé Supabase (aucun mot de passe en clair)
- Rôles : `admin` · `employee` · `demo`
- Impersonation utilisateur pour le support admin
- Audit log complet de toutes les actions
- Rate limiting serveur sur toutes les opérations sensibles

### 📊 Dashboard
- KPIs temps réel : événements, invités, revenus, stock
- Alertes stock bas / critique
- Prochains événements + livraisons du jour
- Graphiques tendances revenus & taux de completion

### 📅 Agenda & Événements
- Vue calendrier + vue liste
- Wizard de création (client, date, menu, invités)
- Multi-département : Cuisine · Boulangerie · Pâtisserie
- Statuts : `pending` → `confirmed` → `in-progress` → `ready` → `delivered`
- Génération devis & factures PDF
- Import d'événements depuis PDF prioritaire

### 📖 Recettes
- Bibliothèque complète avec catégories
- Ingrédients liés à l'entrepôt (coût automatique)
- Scaling de portions (×1, ×2, ×3)
- Coût de revient + prix de vente par portion

### 🏭 Entrepôt
- Suivi des stocks avec seuils d'alerte
- Gestion des fournisseurs et historique des prix
- Mouvements de stock (achats, consommation)
- Génération automatique de liste d'achats

### 📦 Réserve
- Stock de produits préparés avec DLC
- Types : Congélateur · Réfrigérateur · Sec
- Planning de production hebdomadaire
- Détection automatique des articles expirant

### 👨‍🍳 Production (Chef)
- Dashboard tâches par département
- Assignation & suivi : `pending` → `in-progress` → `completed`
- Intégration événements ↔ réserve
- Impression des fiches de production

### 🚚 Livraisons
- Timeline complète de chaque livraison
- Preuve de livraison par photo
- Génération PDF bon de livraison
- Notifications adresse + contact

### 🛍️ Catalogue
- Fiches produits (noms interne / client)
- Prix, taille, département, statut actif
- Liaison directe avec les recettes

### 🛡️ Admin
- Gestion des utilisateurs (inviter, rôles, supprimer)
- Tokens d'accès démo avec expiration
- Logs d'audit complets

---

## 🏗️ Architecture

```
Frontend (React + Vite)
       │
       ▼
Supabase Auth ──── JWT ────► Supabase PostgreSQL (RLS)
       │                           │
       ▼                           ▼
Edge Functions (Deno)        20+ Tables métier
├── invite-user              (events, recipes, warehouse,
├── demo-auto-login           reserve, production, delivery…)
├── impersonate-user
├── delete-user
└── generate-delivery-slip
```

**Stack complète**

| Couche | Technologie |
|---|---|
| UI | React 18 + TypeScript + Tailwind CSS + shadcn/ui |
| Build | Vite 6 |
| Backend | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth |
| Edge Functions | Deno (TypeScript) |
| Email | Resend |
| Déploiement | Lovable |

---

## 🔒 Sécurité

- **Zéro mot de passe en email** — invitations via lien signé JWT
- **Fail-closed** — utilisateur sans rôle immédiatement déconnecté
- **Nettoyage atomique** — si l'assignation de rôle échoue, l'utilisateur est supprimé
- **Anti-énumération** — même réponse succès/échec sur forgot password
- **Rate limiting** — côté serveur sur toutes les Edge Functions (Supabase RPC)
- **Tokens sensibles** — jamais stockés en localStorage

---

## 🚀 Installation locale

### Prérequis
- Node.js 18+
- Compte Supabase (projet configuré)
- Clé API Resend (optionnel, pour les emails)

### Setup

```bash
# Cloner le repo
git clone https://github.com/belhassen-raphael99/kitchenflow-rtl-magic.git
cd kitchenflow-rtl-magic

# Installer les dépendances
npm install --legacy-peer-deps

# Configurer les variables d'environnement
cp .env.example .env
# Remplir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# Lancer le serveur de développement
npx vite
```

### Variables d'environnement

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Variables Supabase Edge Functions (à configurer dans le dashboard Supabase) :
```
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Casserole <noreply@example.com>
ALLOWED_ORIGIN=https://votre-domaine.com
```

---

## 📁 Structure du projet

```
src/
├── components/
│   ├── auth/        # Guards de routes (ProtectedRoute, AdminRoute)
│   ├── layout/      # AppLayout, Sidebar, DemoBanner
│   ├── pages/       # Une page par fichier
│   ├── settings/    # Tabs des paramètres
│   └── ui/          # Composants shadcn/ui
├── context/         # AuthContext, AppContext
├── hooks/           # useAuth, useImpersonation
├── integrations/
│   └── supabase/    # Client + types générés
└── App.tsx          # Routing React Router v6

supabase/
├── functions/       # Edge Functions Deno
└── migrations/      # Migrations SQL horodatées
```

---

## 🗺️ Roadmap MVP 2

Voir [CLAUDE.md](./CLAUDE.md) pour la liste complète des fonctionnalités prévues.

Aperçu :
- 💳 Facturation intégrée (PDF + statuts de paiement)
- 👥 Gestion clients avancée (historique, allergies, CA)
- 📱 PWA mobile pour les chefs en cuisine
- 📢 Notifications temps réel (push + SMS)
- 👷 Planning RH par événement/département
- 📊 Rapports & exports Excel/PDF
- 🛒 Module achats fournisseurs

---

## 👨‍💻 Développeur

**Raphaël Belhassen**
- LinkedIn : [rafael-belassen](https://www.linkedin.com/in/rafael-belassen)
- Email : [rafael.belassen@gmail.com](mailto:rafael.belassen@gmail.com)

---

*Plateforme privée — accès sur invitation uniquement.*
