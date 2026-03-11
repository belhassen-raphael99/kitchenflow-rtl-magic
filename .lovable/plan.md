

# Plan: Nettoyer les doublons et sécuriser le seed

## Problème
Le seed a été lancé plusieurs fois. Les tables `warehouse_items`, `recipes`, `recipe_ingredients`, et `reserve_items` contiennent des doublons (2-3x les données attendues).

## Solution en 2 étapes

### 1. Migration SQL : supprimer les doublons
Exécuter une migration qui garde uniquement la première occurrence (par `name`) et supprime les autres :

```sql
-- Deduplicate warehouse_items (keep oldest by created_at)
DELETE FROM warehouse_items a USING warehouse_items b
WHERE a.id > b.id AND a.name = b.name;

-- Deduplicate reserve_items
DELETE FROM reserve_items a USING reserve_items b
WHERE a.id > b.id AND a.name = b.name;

-- Deduplicate recipes (this cascades to recipe_ingredients via recipe_id)
DELETE FROM recipe_ingredients WHERE recipe_id IN (
  SELECT id FROM recipes WHERE id NOT IN (
    SELECT DISTINCT ON (name) id FROM recipes ORDER BY name, created_at
  )
);
DELETE FROM recipes a USING recipes b
WHERE a.id > b.id AND a.name = b.name;
```

### 2. Mettre à jour l'edge function `seed-data`
Modifier l'edge function pour vérifier l'existence avant d'insérer (ou utiliser upsert) sur toutes les tables, pas seulement suppliers/categories. Cela empêchera les doublons si quelqu'un relance le seed.

### Résultat attendu après nettoyage
- warehouse_items: ~252
- recipes: ~98
- recipe_ingredients: ~500-600
- reserve_items: ~96

