

# Plan: Refonte UI/UX de la plateforme Casserole

## Analyse de l'existant

Apres exploration du code, voici les problemes UX/UI identifies :

1. **Page Auth** — Fonctionnelle mais basique. Le formulaire est un bloc blanc simple sans hierarchy visuelle forte.
2. **Dashboard** — KPI cards manquent de punch visuel. Le hero banner vert uni est generique.
3. **Sidebar** — Custom-built, fonctionne bien mais le footer utilisateur est dense.
4. **Recipe Cards** — Image minuscule (64x64), pas de mise en avant visuelle. Les cartes sont text-heavy.
5. **Warehouse** — Liste tabulaire sans hierarchy, manque de cartes visuelles.
6. **Agenda** — Calendrier + liste, design correct mais les event cards sont petites.
7. **Delivery** — Timeline recente, design a affiner.
8. **Responsive** — Globalement ok mais certaines pages sont serrees sur mobile.
9. **Micro-interactions** — Peu de feedback visuel (hover, transitions, loading states).
10. **Typographie** — Tailles uniformes, peu de contraste hierarchique.

---

## Propositions d'ameliorations

### 1. Recipe Cards — Image-first design
Passer d'une image 64x64 dans le coin a une carte avec image plein-width en haut (aspect-ratio 16/9), titre et badge en overlay. Les infos prix/temps en bas. Style "food blog".

### 2. Dashboard KPIs — Glassmorphism + icones colorees
Remplacer les cartes KPI plates par des cartes avec fond gradient subtil par type (vert pour stock ok, orange pour alertes, bleu pour evenements). Ajouter des icones plus grandes avec un cercle colore en fond.

### 3. Auth Page — Split layout
Sur desktop : layout 50/50 avec a gauche une illustration/branding (gradient + logo + tagline) et a droite le formulaire. Sur mobile : formulaire seul avec header branding compact.

### 4. Sidebar — Micro-animations
Ajouter un indicateur actif anime (barre verte a gauche du lien actif avec transition). Smooth collapse/expand animations.

### 5. Cards & surfaces — Depth system
Uniformiser les elevations : cards au repos = `shadow-soft`, hover = `shadow-card`, modals = `shadow-elevated`. Ajouter `border` subtile sur toutes les cartes. Coins arrondis uniformes `rounded-2xl`.

### 6. Empty states — Illustrations
Remplacer les textes "pas de donnees" par des empty states visuels avec icone SVG + texte + CTA.

### 7. Loading states — Skeleton screens
Remplacer les spinners isoles par des skeleton screens qui imitent la forme du contenu.

### 8. Page headers — Consistent pattern
Chaque page commence par un header uniforme : titre + description + actions (boutons) a droite. Separation visuelle avec le contenu.

### 9. Mobile bottom navigation
Sur mobile, ajouter une barre de navigation fixe en bas avec les 5 pages principales (Dashboard, Agenda, Kitchen, Warehouse, Recipes) au lieu du hamburger menu seul.

### 10. Color accents per section
Chaque section de la sidebar a un accent couleur :
- Dashboard = vert
- Agenda = bleu  
- Kitchen = orange
- Warehouse = violet
- Recipes = rose

Les headers de page et KPIs utilisent cette couleur.

---

## Implementation technique

### Fichiers a modifier

| Fichier | Changement |
|---------|-----------|
| `RecipeCard.tsx` | Image pleine largeur, layout vertical, overlay badge |
| `DashboardPage.tsx` | KPI cards avec gradient, icones plus grandes, hero revu |
| `AuthPage.tsx` | Split layout desktop, branding panel a gauche |
| `AppLayout.tsx` | Ajouter bottom nav mobile |
| `Sidebar.tsx` | Indicateur actif anime, transitions |
| `index.css` | Nouvelles variables CSS pour accents, skeleton keyframes |
| `AgendaPage.tsx` | Header uniforme, event cards plus larges |
| `WarehousePage.tsx` | Cards au lieu de liste plate, status visuels |
| `RecipesPage.tsx` | Grid responsive ameliore (1/2/3 cols) |
| Tous les pages | Page header pattern uniforme, empty states |

### Ordre d'implementation

1. Design system de base (CSS variables, shadow system, page header component)
2. Auth page split layout
3. Dashboard KPIs refonte
4. Recipe cards image-first
5. Sidebar active indicator + transitions
6. Mobile bottom navigation
7. Empty states + skeleton loading
8. Warehouse cards visuelles
9. Color accents par section
10. Polish final (micro-interactions, hover effects)

### Pas de changement de stack
Tout reste en Tailwind CSS + shadcn/ui. Aucune lib externe ajoutee. Les ameliorations sont purement visuelles et CSS.

