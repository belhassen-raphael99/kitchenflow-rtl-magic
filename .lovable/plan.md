

# Fix: Validation mot de passe trop stricte sur le login

## Probleme
La page `AuthPage.tsx` utilise le meme schema de validation (`authSchema`) pour le login et pour la creation de mot de passe. Resultat : si le mot de passe fait moins de 12 caracteres, le formulaire bloque l'envoi cote client, meme si le mot de passe est correct cote serveur.

## Solution
Dans `src/components/pages/AuthPage.tsx`, modifier la validation du mode `login` pour ne pas imposer de contrainte de longueur sur le mot de passe. Le serveur gere sa propre validation.

### Changement dans AuthPage.tsx
- Remplacer le `authSchema` utilise en mode login par un schema plus simple qui valide juste que l'email est valide et que le mot de passe n'est pas vide (`.min(1)` au lieu de `.min(12)`).

```typescript
// Schema pour le login - pas de contrainte de longueur
const loginSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(1, 'נא להזין סיסמה'),
});
```

- Utiliser `loginSchema` au lieu de `authSchema` dans le bloc de validation du mode login (ligne ~123).

Un seul fichier modifie. Effet immediat.

