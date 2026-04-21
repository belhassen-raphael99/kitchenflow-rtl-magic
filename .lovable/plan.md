

## Objectif

Autoriser le domaine Vercel (`*.vercel.app`) dans la configuration CORS de toutes les edge functions, pour que l'app déployée sur `https://kitchenflow-rtl-magic.vercel.app` puisse les appeler sans être bloquée.

## État actuel

Plusieurs edge functions incluent déjà `.vercel.app` dans leur `allowedHosts` (ex. `assign-demo-role`, `demo-otp-signup`, `totp-setup`). Mais d'autres sont restées sur l'ancienne version qui n'autorise que `.lovable.app` (parfois `.lovableproject.com`), donc elles renvoient un CORS bloquant depuis Vercel.

Exemple à corriger (`parse-priority-pdf`) :
```ts
if (origin.endsWith('.lovable.app')) return origin;
```

## Modifications

Dans chaque edge function listée, remplacer le bloc `getAllowedOrigin` par la version unifiée :

```ts
function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('Origin') || '';
  const envOrigin = Deno.env.get('ALLOWED_ORIGIN');
  if (envOrigin && origin === envOrigin) return origin;
  const allowedHosts = ['.lovable.app', '.lovableproject.com', '.vercel.app'];
  if (allowedHosts.some((h) => origin.endsWith(h))) return origin;
  return envOrigin || 'https://kitchenflow-rtl-magic.lovable.app';
}
```

Fonctions auditées et mises à jour si nécessaire :
- `demo-auto-login`
- `invite-user`
- `delete-user`
- `check-alerts`
- `assign-demo-role` (déjà OK — vérification)
- `demo-otp-signup` (déjà OK — vérification)
- `generate-delivery-slip`
- `hash-security-answer`
- `impersonate-user`
- `parse-priority-pdf` (à corriger — actuellement `.lovable.app` seulement)
- `sync-data`
- `totp-setup` (déjà OK — vérification)
- `totp-verify`

## Déploiement et vérification

1. Redéploiement automatique de toutes les fonctions modifiées.
2. Test CORS avec une requête `OPTIONS` simulant l'origine `https://kitchenflow-rtl-magic.vercel.app` sur 2-3 fonctions représentatives (`invite-user`, `parse-priority-pdf`, `totp-verify`) pour confirmer que `Access-Control-Allow-Origin` retourne bien l'origine Vercel.

## Hors périmètre

- Pas de changement de logique métier ni d'authentification.
- Pas de modification de la variable secrète `ALLOWED_ORIGIN` (le fallback envOrigin reste prioritaire si défini).
- Le frontend n'est pas modifié.

