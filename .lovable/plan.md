

## Plan : Ajout du profil utilisateur dans le footer de la sidebar

### Objectif
Afficher l'email, le rôle et un avatar de l'utilisateur connecté dans le footer de la sidebar, avec un menu déroulant offrant l'option de déconnexion.

### Modifications

**Fichier : `src/components/layout/Sidebar.tsx`**

Remplacer la section "Footer actions" (lignes ~186-230) par :

1. **Bloc utilisateur** avec :
   - Avatar (initiales de l'email) via `Avatar`/`AvatarFallback`
   - Email tronqué + badge du rôle (admin/employee)
   - Le tout dans un `DropdownMenu` qui s'ouvre au clic

2. **Menu déroulant** contenant :
   - Header : email complet + rôle
   - Séparateur
   - Option "מסך מלא" (fullscreen)
   - Option "התנתק" (déconnexion, en rouge)

3. **Mode collapsed** (sidebar fermée sur desktop) : afficher uniquement l'avatar cliquable avec le même dropdown

### Composants utilisés
- `Avatar`, `AvatarFallback` (déjà installés)
- `DropdownMenu`, `DropdownMenuItem`, etc. (déjà installés)
- `Badge` (déjà installé)
- `useAuth()` pour `user.email` et `role`

### Comportement
- Quand sidebar ouverte : avatar + email + rôle badge + chevron
- Quand sidebar fermée (desktop) : avatar seul, dropdown au clic
- Le dropdown remplace les boutons fullscreen et déconnexion actuels

