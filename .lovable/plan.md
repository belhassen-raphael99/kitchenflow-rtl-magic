## Diagnostic senior — cause réelle

Do I know what the issue is? Oui.

Ce n’est pas un problème de CSS, de CORS, de rôles, ni de RLS.

Les logs backend montrent que les tentatives email/mot de passe échouent au niveau du service d’authentification avec :

```text
POST /auth/v1/token?grant_type=password -> 400 invalid_credentials
```

Pour ton compte `b.raphael1998@gmail.com`, j’ai vérifié côté backend :

- le compte existe ;
- l’email est confirmé ;
- le compte a bien un mot de passe enregistré ;
- le rôle `admin` existe ;
- le profil indique `password: true` ;
- le compte est aussi lié à Google ;
- une ancienne session active existe encore via refresh token.

Donc le bug exact est celui-ci :

```text
Le mot de passe que tu tapes n’est pas celui qui est actuellement enregistré côté auth,
MAIS l’app garde encore une ancienne session active, ce qui donne l’impression que le compte est “bon”
alors que le login email/password échoue réellement.
```

Et le flux “mot de passe oublié” n’est pas assez strict aujourd’hui :

1. `ResetPasswordPage` met `sessionStorage.auth_recovery = true` dès l’ouverture de la page, avant même de valider que le lien email est un vrai lien de récupération.
2. Si une ancienne session existe déjà, la page peut accepter cette session comme contexte de reset.
3. Après changement de mot de passe, le code fait un `signOut()` simple, pas une déconnexion globale. Les anciennes sessions/refresh tokens peuvent rester vivants.
4. Le reset ne gère pas proprement tous les formats de lien auth possibles : hash `#access_token=...&type=recovery` et query `?code=...`.
5. L’edge function d’invitation utilise encore prioritairement `ALLOWED_ORIGIN` pour construire le lien `/reset-password`, ce qui peut envoyer vers le mauvais domaine quand l’app est utilisée depuis Vercel.

Résultat : tu peux te retrouver avec un compte confirmé + ancien token actif + mot de passe backend différent de celui que tu crois avoir défini.

## Plan de correction

### 1. Rendre `/reset-password` strict et déterministe

Modifier `src/components/pages/ResetPasswordPage.tsx` pour que la page n’autorise le changement de mot de passe que si elle reçoit un vrai contexte de récupération :

- accepter les liens avec hash :
  - `#access_token=...&refresh_token=...&type=recovery`
  - `#access_token=...&refresh_token=...&type=invite`
- accepter les liens avec query string :
  - `?code=...`
  - `?type=recovery`
  - `?type=invite`
- ne plus poser `sessionStorage.auth_recovery = true` automatiquement dès l’arrivée sur la page ;
- poser le flag seulement après détection d’un lien recovery/invite valide ;
- si un `code` est présent, tenter explicitement l’échange de code contre session ;
- si le client auth a déjà consommé le lien automatiquement, accepter la session uniquement si l’URL prouve qu’on vient bien d’un lien recovery/invite ;
- si aucun token/code recovery n’est présent, afficher “lien invalide ou expiré”.

### 2. Après reset, invalider toutes les anciennes sessions

Dans `ResetPasswordPage.tsx`, remplacer la sortie simple par une sortie globale :

```ts
await supabase.auth.signOut({ scope: 'global' })
```

Objectif :

```text
Nouveau mot de passe défini -> tous les anciens refresh tokens invalidés -> retour forcé à /auth -> login obligatoire avec le nouveau mot de passe.
```

C’est indispensable pour supprimer la confusion actuelle : ancienne session active mais login email/password refusé.

### 3. Nettoyer les guards auth pour éviter les boucles invisibles

Modifier :

- `src/components/auth/AuthRoute.tsx`
- `src/components/auth/ProtectedRoute.tsx`

But :

- garder le blocage d’accès à l’app pendant un reset réel ;
- ne jamais bloquer l’utilisateur à cause d’un vieux `sessionStorage.auth_recovery` oublié ;
- nettoyer ce flag quand on arrive sur `/auth` sans lien recovery actif.

### 4. Corriger les liens d’invitation/reset depuis les domaines réels

Modifier `supabase/functions/invite-user/index.ts` :

- ne plus construire `redirectTo` uniquement depuis `ALLOWED_ORIGIN` ;
- utiliser l’origine réelle autorisée de la requête (`lovable.app`, `lovableproject.com`, `vercel.app`) ;
- générer :

```text
{origin_reel}/reset-password
```

Exemple attendu depuis Vercel :

```text
https://kitchenflow-rtl-magic.vercel.app/reset-password
```

Puis redéployer `invite-user`.

### 5. Mettre la page login au niveau professionnel

Modifier `src/components/pages/AuthPage.tsx` :

- mettre les champs email/password en LTR pour éviter les problèmes RTL avec email, chiffres et caractères spéciaux ;
- ajouter un bouton afficher/masquer le mot de passe ;
- ajouter un warning Caps Lock si détecté ;
- sur `Invalid login credentials`, proposer directement l’action “envoyer un lien de reset” au lieu d’un toast vague ;
- ajouter un bouton “Connexion Google” puisque ton compte est lié à Google, sans remplacer email/password.

Important : le mot de passe Google et le mot de passe de l’app ne sont pas forcément le même. Le bouton Google élimine cette ambiguïté.

### 6. Vérifier/configurer les URLs autorisées auth

Côté configuration Lovable Cloud Auth, vérifier/ajouter les URLs de redirection autorisées :

```text
https://kitchenflow-rtl-magic.lovable.app/reset-password
https://kitchenflow-rtl-magic.vercel.app/reset-password
https://*.lovableproject.com/reset-password
```

Objectif : éviter qu’un email de reset soit accepté par le backend mais redirige ailleurs que `/reset-password`.

### 7. Validation après patch

Je vérifierai ensuite :

1. `mot de passe oublié` envoie bien vers `/reset-password` ;
2. ouvrir le lien email n’entre pas dans l’app ;
3. la page force bien la saisie d’un nouveau mot de passe ;
4. après validation, toutes les sessions sont révoquées ;
5. l’utilisateur revient sur `/auth` ;
6. le login email/password fonctionne uniquement avec le nouveau mot de passe ;
7. l’ancien mot de passe/session ne fonctionne plus ;
8. le lien d’invitation depuis Vercel pointe bien vers Vercel `/reset-password`.

## Fichiers concernés

- `src/components/pages/ResetPasswordPage.tsx`
- `src/components/pages/AuthPage.tsx`
- `src/components/auth/AuthRoute.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- `supabase/functions/invite-user/index.ts`

## Ce que je ne vais pas faire

- Pas de modification manuelle du client auth généré.
- Pas de stockage de rôle côté client.
- Pas de contournement de sécurité.
- Pas de magic login silencieux après reset.
- Pas de reset password qui entre directement dans l’application.

## Résultat attendu

Après correction, le flux sera strict :

```text
Mot de passe oublié
-> email reçu
-> /reset-password
-> nouveau mot de passe obligatoire
-> déconnexion globale
-> retour /auth
-> connexion obligatoire avec le nouveau mot de passe
```

Et si le problème est simplement que tu utilises le mot de passe Google au lieu du mot de passe app, le bouton Google sera disponible clairement sur la page login.

<lov-actions>
  <lov-open-history>View History</lov-open-history>
  <lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>