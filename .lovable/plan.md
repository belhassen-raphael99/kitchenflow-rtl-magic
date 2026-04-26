
## Diagnostic

### Problème 1 — "Invalid login credentials" alors que le mot de passe semble correct

Le code de connexion (`AuthPage.handleLogin` → `signIn` → `supabase.auth.signInWithPassword`) est **correct**. Les logs auth Supabase confirment l'erreur `400 invalid_credentials` côté serveur — ça veut dire que **Supabase ne trouve pas la combinaison email/password en base**.

Causes possibles (à vérifier par l'utilisateur) :
- **a.** Le compte a été créé via **invitation** (`invite-user` edge function) mais le lien d'invitation n'a jamais été ouvert / le password n'a jamais été défini → en base Supabase, le user existe mais sans `encrypted_password`.
- **b.** Un précédent reset de mot de passe a "réussi" côté UI mais en réalité le password n'a jamais été mis à jour à cause du Problème 2 ci-dessous (le user a été connecté via le lien recovery, n'a pas vu le formulaire de reset, et a fermé l'onglet).
- **c.** Email pas encore confirmé.
- **d.** Caps Lock / clavier hébreu actif → le mot de passe tapé n'est pas exactement celui en base.
- **e.** Espaces invisibles dans l'email (mais on fait déjà `trim().toLowerCase()`).

### Problème 2 — Le lien "mot de passe oublié" connecte sans demander un nouveau mot de passe

Le code *essaye* de gérer le cas (`AuthPage.handleHashToken` + `AuthRoute` qui regarde `sessionStorage.auth_recovery`), mais la mécanique est **fragile** et casse dans plusieurs scénarios :

1. **Ordre incorrect dans `handleHashToken`** (`AuthPage.tsx:68-72`) : `sessionStorage.setItem('auth_recovery', 'true')` est fait *avant* `await setSession(...)`. Si setSession échoue, le flag reste à `true` et bloque les futures tentatives de login dans cet onglet.
2. **Race condition réelle** : entre le moment où `setSession` déclenche `SIGNED_IN` (qui re-render `AuthRoute` avec `user != null`) et le moment où `setViewMode('reset-password')` s'applique, **`AuthRoute` peut redéclencher** `<Navigate to="/" />` si le flag n'est pas encore lu correctement.
3. **Le flag `auth_recovery` n'est jamais nettoyé en cas d'abandon** : nettoyé seulement dans `handleResetPassword` (succès). Si le user ferme l'onglet, le flag pollue sessionStorage.
4. **Quand le user clique le lien email, il arrive sur `/auth#access_token=...&type=recovery`** mais `AuthRoute` lit `searchParams` (query string) et `window.location.hash` séparément. Sur certains navigateurs / SPA refresh, le hash peut être consommé par Supabase (auto `detectSessionInUrl`) **avant** que `AuthRoute` ne l'inspecte → connexion silencieuse, redirect vers `/`, jamais de formulaire.
5. **`detectSessionInUrl` n'est pas désactivé** dans `supabase/client.ts` → Supabase auto-détecte et consomme les tokens du hash, créant la session **avant** que notre logique applicative ne réagisse.

C'est ce dernier point qui est probablement la cause racine.

## Plan de correction

### Étape 1 — Créer une route dédiée `/reset-password` (pattern recommandé)

Plutôt que de mélanger login + reset sur `/auth` avec une logique de hash fragile, créer une **page séparée** `/reset-password` :

- Nouvelle page `src/components/pages/ResetPasswordPage.tsx` qui :
  - Lit le hash recovery au mount, appelle `setSession` explicitement.
  - Affiche **uniquement** le formulaire "nouveau mot de passe" + confirmation.
  - Au succès : `updateUser({ password })` → `signOut()` → toast "Connecte-toi avec ton nouveau mot de passe" → redirige vers `/auth`.
  - Si pas de token recovery valide dans le hash → affiche "lien invalide ou expiré" + bouton retour.
- Route ajoutée dans `App.tsx` : `<Route path="/reset-password" element={<ResetPasswordPage />} />` **en dehors** de `ProtectedRoute` et de `AuthRoute` (route publique pure, sans aucune logique de redirection conditionnelle).

### Étape 2 — Mettre à jour `redirectTo` partout

Changer les 3 occurrences :
- `src/components/pages/AuthPage.tsx:145` (forgot password)
- `src/components/pages/AdminUsersPage.tsx:268` (resend invite)
- `supabase/functions/invite-user/index.ts:201` (invitation)

De `${origin}/auth` → `${origin}/reset-password`.

### Étape 3 — Désactiver `detectSessionInUrl` automatique

Dans `src/integrations/supabase/client.ts`, ajouter `detectSessionInUrl: false` dans les options auth, pour que **nous** contrôlions explicitement quand un hash recovery est consommé. Sinon Supabase consomme le token et redirige avant que notre code ne réagisse.

### Étape 4 — Nettoyer `AuthPage.tsx` et `AuthRoute.tsx`

Une fois `/reset-password` séparé :
- Retirer toute la logique `handleHashToken`, `viewMode === 'reset-password'`, `renderResetPassword`, le flag `sessionStorage.auth_recovery` de `AuthPage.tsx`.
- Simplifier `AuthRoute.tsx` : retirer la détection recovery (plus nécessaire car la route reset est ailleurs). Garder juste : `if (user && !loading) → Navigate("/")`.
- `AuthPage.tsx` ne gère plus que `login` et `forgot-password`.

### Étape 5 — Améliorer le message d'erreur de login

Dans `handleLogin`, quand on reçoit `Invalid login credentials`, afficher un message plus actionnable :
> "אימייל או סיסמה שגויים. אם קיבלת הזמנה ולא הגדרת סיסמה, השתמש בקישור 'שכחת סיסמה' כדי להגדיר סיסמה ראשונה."
> ("Email ou mot de passe incorrects. Si tu as reçu une invitation et que tu n'as pas défini de mot de passe, utilise 'mot de passe oublié' pour en définir un.")

### Étape 6 — Vérification utilisateur (côté toi, après mes changements)

Une fois le code en place, il faudra vérifier dans le dashboard Lovable Cloud (Auth) :
- Pour `b.raphael1998@gmail.com` : est-ce que la colonne `encrypted_password` est NULL ? Si oui → demander un reset password (le nouveau flow `/reset-password` permettra de définir le password pour la première fois).
- Vérifier que la **Site URL** dans la config Auth Supabase = l'URL de production (`https://kitchenflow-rtl-magic.lovable.app` ou le domaine Vercel), et que `/reset-password` est dans la liste des **Redirect URLs** autorisées.

## Hors périmètre

- Pas de changement aux edge functions à part `invite-user` (juste le `redirectTo`).
- Pas de modification des RLS ou des tables.
- Pas de changement au flow d'invitation (juste la cible du lien).

## Résultat attendu

- Le lien "mot de passe oublié" arrive sur une page dédiée qui **force** la saisie d'un nouveau mot de passe + confirmation, signe la session out, et renvoie vers `/auth` pour reconnexion explicite.
- Les utilisateurs invités peuvent définir leur premier mot de passe via le même flow recovery (cohérent).
- Le message d'erreur de login guide vers la bonne action quand le compte n'a pas de password défini.
