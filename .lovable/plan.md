
# Rapport d'Audit de Sécurité - Casserole (Kitchen Flow)
## Analyse Complète OWASP Top 10

---

## SYNTHÈSE EXÉCUTIVE

| Catégorie | Niveau de Risque | Statut |
|-----------|------------------|--------|
| Authentification | ✅ Bon | Système invitation-only avec validation forte |
| Autorisation (RBAC) | ✅ Bon | RLS strict avec séparation admin/employee |
| Injection SQL/XSS | ✅ Excellent | Supabase RLS + Zod validation |
| Gestion des erreurs | ✅ Excellent | Messages génériques, pas de fuite technique |
| Rate Limiting | ✅ Excellent | Implémenté côté serveur |
| Headers de sécurité | ⚠️ À améliorer | CSP/HSTS manquants |
| Données sensibles | ⚠️ À améliorer | PII accessibles à tous les employés |
| Mots de passe | ⚠️ À améliorer | Leaked password protection désactivée |

**Score global : 7.5/10** - Bon niveau de sécurité avec quelques améliorations recommandées.

---

## 1. AUTHENTIFICATION & AUTORISATION

### ✅ Points Forts

**A. Système invitation-only sécurisé**
- Pas de signup public (`/auth` n'affiche que le login)
- Création d'utilisateurs via Edge Function `invite-user` avec :
  - Validation JWT obligatoire
  - Vérification du rôle admin de l'appelant
  - Rate limiting (10 invitations/heure par admin)
  - Validation Zod stricte des données

**B. RBAC (Role-Based Access Control) strict**
- Table `user_roles` séparée (pas de rôle dans `profiles`)
- Fonction `has_role()` Security Definer pour éviter la récursion RLS
- Policies RLS strictes sur 16 tables :
  - `SELECT` : Utilisateurs authentifiés
  - `INSERT/UPDATE/DELETE` : Admins uniquement

**C. Gestion des sessions**
- Supabase Auth avec tokens JWT
- Refresh automatique des tokens
- Protection contre l'auto-suppression (admin ne peut pas se supprimer)

### ⚠️ Vulnérabilités Identifiées

**V1. Leaked Password Protection désactivée**
- **Risque** : MOYEN
- **Impact** : Les utilisateurs peuvent utiliser des mots de passe compromis
- **Correction** : Activer dans les paramètres Supabase Auth

**V2. Politique de mot de passe incohérente**
- **Risque** : FAIBLE
- `AuthPage.tsx` : minimum 6 caractères
- `validation.ts` + Edge Functions : minimum 12 caractères + complexité
- **Correction** : Aligner les règles frontend sur le backend (12 caractères)

---

## 2. PROTECTION DES DONNÉES (PII)

### ⚠️ Vulnérabilités Identifiées

**V3. Données clients exposées à tous les employés**
- **Table** : `clients`
- **Données** : email, téléphone, adresse
- **Risque** : MOYEN
- **Impact** : Vol de contacts clients, phishing
- **Correction suggérée** :
  
```sql
-- Créer une vue sans PII pour les employés
CREATE VIEW public.clients_limited
WITH (security_invoker=on) AS
  SELECT id, name, notes, created_at
  FROM public.clients;

-- Modifier la policy pour restreindre l'accès direct
CREATE POLICY "Only admins can view full client data"
ON public.clients FOR SELECT
USING (has_role(auth.uid(), 'admin'));
```

**V4. Données tarifaires visibles par tous**
- **Tables** : `warehouse_items`, `recipes`
- **Données** : prix fournisseurs, marges, coûts de revient
- **Risque** : FAIBLE
- **Impact** : Fuite d'informations business compétitives
- **Correction suggérée** : Créer des vues sans colonnes `price`, `cost_per_serving`, `selling_price` pour les employés

**V5. Logs d'audit contenant potentiellement des PII**
- **Table** : `audit_logs`
- **Données** : `old_data`, `new_data` en JSONB
- **Risque** : FAIBLE (accès admin seulement)
- **Correction suggérée** : Implémenter une politique de rétention (supprimer après 90 jours)

---

## 3. VALIDATION DES ENTRÉES (XSS/Injection)

### ✅ Excellent niveau de protection

**A. Bibliothèque de validation centralisée** (`src/lib/validation.ts`)
- Fonctions de sanitization HTML : `sanitizeHtml()`, `sanitizeText()`, `sanitizeName()`, `sanitizeUrl()`
- Schémas Zod pour tous les formulaires avec transformations de nettoyage
- Détection de patterns SQL injection (`containsSqlInjection()`)

**B. Protection côté serveur**
- Edge Functions utilisent Zod avec les mêmes règles
- Supabase RLS empêche toute injection SQL directe
- Paramètres toujours échappés via le client Supabase

**C. Usage de `dangerouslySetInnerHTML`**
- **Seul usage** : `src/components/ui/chart.tsx` pour injecter des variables CSS
- **Risque** : NÉGLIGEABLE (valeurs typées, pas de données utilisateur)

---

## 4. SÉCURITÉ DE L'API & HEADERS

### ⚠️ À améliorer

**V6. Headers de sécurité manquants**
- **Fichiers concernés** : `index.html`, Edge Functions
- **Risque** : MOYEN
- **Headers manquants** :
  - `Content-Security-Policy` (CSP)
  - `Strict-Transport-Security` (HSTS)
  - `X-Frame-Options`
  - `X-Content-Type-Options`

**Corrections recommandées :**

1. **Dans `index.html`** - Ajouter des meta tags CSP :
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.resend.com;">
<meta http-equiv="X-Frame-Options" content="DENY">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
```

2. **Dans les Edge Functions** - Ajouter les headers de sécurité :
```typescript
const securityHeaders = {
  ...corsHeaders,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
```

### ✅ Points Forts

**A. Rate Limiting serveur**
- Table `rate_limits` avec fonction `check_rate_limit()`
- Limites par action :
  - `invite_user` : 10/heure
  - `delete_user` : 5/heure

**B. CORS configuré**
- Headers CORS présents sur toutes les Edge Functions

---

## 5. GESTION DES ERREURS

### ✅ Excellent

**A. Librairie `errorHandler.ts`**
- Messages utilisateur génériques (aucune fuite technique)
- Classification des erreurs par type
- Logging technique uniquement en développement

**B. Edge Functions**
- Fonction `errorResponse()` avec logs serveur uniquement
- Messages d'erreur ne révélant pas l'existence d'emails

---

## 6. DÉPENDANCES

### ✅ Bon état

**Dépendances principales analysées :**
| Package | Version | Statut |
|---------|---------|--------|
| React | ^19.2.3 | ✅ À jour |
| Supabase JS | ^2.89.0 | ✅ À jour |
| Zod | ^3.25.76 | ✅ À jour |
| React Router | ^6.30.1 | ✅ À jour |

**Recommandation** : Configurer Dependabot ou Renovate pour les mises à jour automatiques.

---

## 7. POLICIES RLS PROBLÉMATIQUES

### ⚠️ Deux policies avec `WITH CHECK (true)`

**Tables concernées :**
1. `audit_logs` - Policy "System can insert audit logs"
2. `notifications` - Policy "Service role can insert notifications"

**Analyse** : Ces policies sont **intentionnelles** car :
- `audit_logs` doit pouvoir être insérée par les triggers
- `notifications` doit pouvoir être insérée par le service role (cron jobs)

**Risque** : FAIBLE - Ces tables n'exposent pas de données sensibles et les insertions sont contrôlées côté serveur.

---

## PLAN DE REMÉDIATION

### 🔴 Priorité Haute (1-2 semaines)

| # | Correction | Effort |
|---|------------|--------|
| 1 | Activer Leaked Password Protection | 5 min |
| 2 | Aligner validation mot de passe frontend sur 12 caractères | 30 min |
| 3 | Ajouter headers CSP dans `index.html` | 1h |

### 🟠 Priorité Moyenne (1 mois)

| # | Correction | Effort |
|---|------------|--------|
| 4 | Restreindre accès PII clients (vue limitée) | 2h |
| 5 | Ajouter headers sécurité dans Edge Functions | 1h |
| 6 | Implémenter politique rétention audit logs | 2h |

### 🟢 Priorité Basse (3 mois)

| # | Correction | Effort |
|---|------------|--------|
| 7 | Restreindre données tarifaires pour employés | 3h |
| 8 | Configurer Dependabot | 30 min |
| 9 | Considérer MFA pour admins | 4h |

---

## ARCHITECTURE DE SÉCURITÉ ACTUELLE

```text
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    │
│  │ Zod Schemas │───▶│ sanitizeHtml │───▶│ Supabase Client │    │
│  │ (validation)│    │ sanitizeText │    │  (parameterized)│    │
│  └─────────────┘    └──────────────┘    └────────┬────────┘    │
└─────────────────────────────────────────────────┼──────────────┘
                                                  │ JWT Token
                                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE (Backend)                         │
│  ┌─────────────────┐    ┌──────────────────────────────────┐   │
│  │   Edge Functions│    │         PostgreSQL               │   │
│  │  ┌───────────┐  │    │  ┌────────────────────────────┐  │   │
│  │  │ Rate Limit│  │    │  │      RLS Policies          │  │   │
│  │  │ JWT Check │  │    │  │  ┌──────────────────────┐  │  │   │
│  │  │ Admin Role│  │    │  │  │ has_role() function  │  │  │   │
│  │  │ Zod Valid │  │    │  │  │ (Security Definer)   │  │  │   │
│  │  └───────────┘  │    │  │  └──────────────────────┘  │  │   │
│  └─────────────────┘    │  └────────────────────────────┘  │   │
│                         └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## CONCLUSION

L'application Casserole présente un **bon niveau de sécurité** avec une architecture "Zero Trust" bien implémentée :

**✅ Points excellents :**
- RBAC strict avec RLS
- Validation Zod centralisée
- Gestion des erreurs sécurisée
- Rate limiting serveur
- Audit logging

**⚠️ Améliorations nécessaires :**
- Headers HTTP de sécurité
- Protection contre mots de passe compromis
- Restriction des PII aux admins

L'application est prête pour la production avec les corrections prioritaires 1-3 du plan de remédiation.
