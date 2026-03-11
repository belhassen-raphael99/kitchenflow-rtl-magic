

# Fix: CSP bloque le chargement de l'app

## Problème
La directive CSP `frame-ancestors 'none'` dans `index.html` empêche l'app de se charger dans l'iframe de preview Lovable. De plus, la CSP est trop restrictive pour un meta tag (les CSP strictes devraient être gérées côté serveur, pas en meta tag).

## Solution
Supprimer la ligne CSP meta tag de `index.html` (ligne 13). Les headers de sécurité HTTP sont mieux gérés au niveau du serveur de déploiement, pas via meta tags qui causent des problèmes en développement.

### Fichier modifié : `index.html`
- Supprimer la ligne 13 : `<meta http-equiv="Content-Security-Policy" content="..." />`

C'est tout. Un seul changement, effet immédiat.

