# CLAUDE.md — Guide de travail sur Casserole (KitchenFlow)

## ⚠️ RÈGLES OBLIGATOIRES — À RESPECTER ABSOLUMENT

### Avant chaque modification de code
> **Toujours demander l'accord explicite du client avant de générer ou modifier du code.**
> Présenter ce qui sera fait, les fichiers touchés, et attendre une validation claire ("ok", "go", "vas-y") avant de commencer.

### Après chaque modification
> **Toujours faire un `git commit` + `git push origin main` après chaque lot de modifications.**
> Le message de commit doit décrire précisément ce qui a été modifié et pourquoi.

---

## 🍲 Présentation du projet

**Casserole** est une plateforme ERP privée de gestion de catering, développée pour un seul client.
Elle est construite en React + TypeScript + Supabase (PostgreSQL + Edge Functions) et déployée sur Lovable.

- **Repo GitHub :** https://github.com/belhassen-raphael99/kitchenflow-rtl-magic
- **Stack :** React 18, TypeScript, Vite, Tailwind CSS, Supabase, Resend (email)
- **Langue UI :** Hébreu (RTL)
- **Accès :** Invitation uniquement — pas d'inscription publique
- **Rôles :** `admin`, `employee`, `demo`

---

## 📋 Fonctionnalités actuelles (MVP 1)

### 🔐 Authentification & Utilisateurs
- Connexion email + mot de passe uniquement
- Réinitialisation de mot de passe par email (lien sécurisé Supabase)
- Invitation de nouveaux utilisateurs par l'admin (lien d'invitation, pas de mot de passe en clair)
- Gestion des rôles : `admin` (accès total), `employee` (accès limité), `demo` (lecture seule)
- Impersonation : l'admin peut se connecter en tant qu'un employé pour le support
- Mode démo : accès temporaire 30 min via token généré par l'admin
- Audit log : toutes les actions sont tracées

### 📊 Dashboard
- Compteur d'événements du jour / de la semaine
- Suivi des invités par événement
- Tâches de production actives
- Niveaux de stock entrepôt (alertes bas / critique)
- Métriques de revenus (mensuel, factures en attente)
- Résumé des livraisons du jour
- Prochain événement + calendrier hebdomadaire
- Graphiques : tendances revenus, taux de completion des tâches

### 📅 Agenda / Événements
- Vue calendrier + vue liste
- Création d'événements avec wizard (client, date, type, invités)
- Liaison client → événement
- Planification multi-département (Cuisine, Boulangerie, Pâtisserie)
- Items par événement (plats, quantités, recettes)
- Statuts : `pending` → `confirmed` → `in-progress` → `ready` → `delivered`
- Génération de devis et factures
- Informations de livraison (adresse, horaire, preuves photo)
- Import d'événements prioritaires depuis PDF
- Opérations en masse (multi-sélection)

### 📖 Recettes
- Bibliothèque de recettes avec catégories
- Gestion des ingrédients + liaison avec l'entrepôt
- Quantités scalables (×1, ×2, ×3 portions)
- Coût par portion + prix de vente
- Configuration du type d'assemblage
- Métadonnées : temps de préparation/cuisson, instructions, image
- Limite de capacité en grammes

### 🏭 Entrepôt (Warehouse)
- Suivi des stocks (quantité actuelle, seuils minimum)
- Gestion des fournisseurs avec prix
- Historique des mouvements (achats, consommation)
- Filtrage par catégorie + recherche
- Génération de liste d'achats
- Alertes stock bas / critique
- Pagination

### 📦 Réserve (Stock de production)
- Articles préparés avec gestion de la DLC
- Types de stockage : Congélateur, Réfrigérateur, Sec
- Planning de production (jour de la semaine, quantités minimales)
- Mouvements : produire, consommer, ajuster
- Détection stock bas + articles expirant bientôt
- Logs de production avec deltas de quantités

### 👨‍🍳 Chef / Production
- Dashboard tâches de production par département
- Assignation des tâches aux employés
- Suivi progression : `pending` → `in-progress` → `completed`
- Planification par priorité
- Intégration avec événements + réserve
- Calendrier livraisons du jour
- Impression des tâches de production
- Filtrage par département / statut

### 🚚 Livraisons
- Timeline : `pending` → `preparing` → `ready` → `dispatched` → `delivered`
- Mapping événement ↔ livraison
- Gestion adresses + contacts
- Capture photo de preuve (caméra / upload)
- Génération PDF bon de livraison
- Tracking preuve de livraison
- Notes et messagerie de livraison

### 🛍️ Catalogue (Menu site web)
- Fiches produits (nom interne / externe)
- Prix par article
- Liaison recette
- Classification par département
- Options de taille
- Gestion statut actif / inactif

### ⚙️ Paramètres
- Profil : nom, email, avatar
- Sécurité : changement de mot de passe, méthodes de connexion
- Notifications

### 🛡️ Panel Admin
- Gestion utilisateurs (inviter, rôles, supprimer)
- Génération et gestion de tokens démo
- Impersonation utilisateur
- Logs d'audit

---

## 🗄️ Base de données — Tables principales

| Table | Description |
|---|---|
| `profiles` | Infos utilisateurs (nom, email, avatar) |
| `user_roles` | Rôles (`admin`, `employee`, `demo`) |
| `events` | Événements catering |
| `event_items` | Items (plats) par événement |
| `clients` | Clients liés aux événements |
| `recipes` | Bibliothèque recettes |
| `recipe_ingredients` | Ingrédients par recette |
| `catalog_items` | Produits catalogue |
| `warehouse_items` | Articles d'entrepôt |
| `stock_movements` | Historique mouvements de stock |
| `reserve_items` | Articles de réserve préparés |
| `production_tasks` | Tâches de production |
| `production_schedule` | Planning hebdomadaire |
| `production_logs` | Logs de production |
| `categories` | Catégories partagées |
| `suppliers` | Fournisseurs |
| `notifications` | Notifications in-app |
| `audit_logs` | Audit de toutes les actions |
| `demo_tokens` | Tokens d'accès démo |
| `rate_limits` | Compteurs rate limiting serveur |

---

## 🚀 MVP 2 — Fonctionnalités à ajouter

### Priorité Haute
- [ ] **Gestion des clients avancée** — Fiche client complète (historique commandes, CA total, préférences alimentaires, allergies), recherche et filtres avancés
- [ ] **Facturation intégrée** — Génération PDF de factures/devis, numérotation automatique, statuts de paiement (payé/en attente/en retard), export comptable
- [ ] **Notifications temps réel** — Push notifications web, alertes SMS via Twilio pour livraisons urgentes, emails automatiques aux clients sur statut événement
- [ ] **Planning RH** — Assignation des employés par événement/département, vue planning hebdomadaire, gestion des disponibilités
- [ ] **Suivi coûts & marges** — Calcul automatique du coût de revient par événement, marge brute, comparaison budgété vs réel

### Priorité Moyenne
- [ ] **Module Achats** — Bons de commande fournisseurs, suivi des livraisons fournisseurs, historique prix, comparatif fournisseurs
- [ ] **Application mobile (PWA)** — Optimisation mobile pour les chefs en cuisine, scan QR codes sur les articles de réserve, capture photo facilitée
- [ ] **Exports & Rapports** — Export Excel/CSV de tous les modules, rapports PDF hebdomadaires/mensuels, rapport de rentabilité par événement
- [ ] **Intégration calendrier** — Sync Google Calendar / Outlook pour les événements, invitations automatiques aux équipes
- [ ] **Gestion des menus** — Composition de menus à partir du catalogue, templates de menus par type d'événement, calcul automatique des quantités

### Priorité Basse
- [ ] **Portail client** — Interface read-only pour les clients pour suivre leur événement, valider le devis en ligne, consulter la facture
- [ ] **API publique** — Endpoints REST documentés pour intégration avec site web du client
- [ ] **Analytics avancés** — Dashboard BI avec tendances sur 12 mois, prévisions de charge, analyse des plats les plus rentables
- [ ] **Multi-langue** — Support Français + Arabe en plus de l'Hébreu
- [ ] **Intégration comptable** — Export vers QuickBooks / Xero / logiciel comptable israélien

---

## 🏗️ Architecture technique

```
src/
├── components/
│   ├── auth/          # ProtectedRoute, AdminRoute, AuthRoute
│   ├── kitchen/       # Composants spécifiques production
│   ├── layout/        # AppLayout, Sidebar, DemoBanner, ImpersonationBanner
│   ├── onboarding/    # DemoTour
│   ├── pages/         # Une page = un fichier
│   ├── settings/      # Tabs des paramètres
│   └── ui/            # shadcn/ui components
├── context/           # AuthContext, AppContext
├── hooks/             # useAuth, useImpersonation, use-toast
├── integrations/
│   └── supabase/      # client.ts, types.ts
└── App.tsx            # Routing principal

supabase/
├── functions/         # Edge Functions Deno
│   ├── invite-user/
│   ├── demo-auto-login/
│   ├── impersonate-user/
│   ├── delete-user/
│   ├── totp-setup/ & totp-verify/
│   └── generate-delivery-slip/
└── migrations/        # SQL migrations horodatées
```

---

## 🔒 Sécurité — Principes appliqués

- Pas de mot de passe en clair dans les emails (invitation via lien signé Supabase)
- Rate limiting serveur sur toutes les Edge Functions sensibles
- Fail-closed : un utilisateur sans rôle est immédiatement déconnecté
- Anti-énumération email sur le forgot password (même message succès/échec)
- Tokens sensibles jamais stockés en localStorage
- Nettoyage atomique : si l'assignation de rôle échoue à l'invitation, l'utilisateur est supprimé

---

## 📝 Workflow de développement

1. **L'utilisateur décrit la modification souhaitée**
2. **Claude présente le plan** (fichiers touchés, logique, impact)
3. **L'utilisateur valide** ("ok", "go", etc.)
4. **Claude implémente** + vérifie TypeScript (`tsc --noEmit`)
5. **Claude push** sur `main` avec commit descriptif
