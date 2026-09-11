# Architecture

## Principes

1. **Un seul état applicatif** (`AppState`), sérialisable, versionné, persisté tel quel.
2. **Calculs dérivés purs** : rien n'est stocké deux fois. Le patrimoine net, le
   taux d'épargne, les plus-values ou la consommation d'un budget sont toujours
   recalculés depuis les données sources (`src/lib/selectors.ts`).
3. **La persistance est une couche isolée** : remplacer `localStorage` par une API
   ne demande de modifier que `src/store/persistence.ts`.
4. **Pas de dépendance UI** : un seul fichier de style, des jetons de couleur, un
   mode sombre sélectionné (et non une inversion automatique).

## Couches

```
types.ts            modèle de données
  ↓
store/persistence   chargement / sauvegarde / migration (localStorage)
store/store.tsx     reducer + contexte React (upsert / remove / settings)
  ↓
lib/selectors.ts    calculs dérivés purs (totaux, budgets, portefeuille, patrimoine)
lib/filters.ts      périodes, recherche, filtres
  ↓
pages/              une page par domaine fonctionnel
components/         UI réutilisable (cartes, modales, tableaux, graphiques)
```

### Organisation des fichiers

| Chemin | Rôle |
|---|---|
| `src/types.ts` | Toutes les entités du domaine |
| `src/data/seed.ts` | Jeu de démonstration déterministe (13 mois) |
| `src/store/persistence.ts` | Lecture/écriture, validation, migrations |
| `src/store/store.tsx` | `StoreProvider`, `useStore()`, actions génériques |
| `src/lib/date.ts` | Mois, dates ISO, formats français |
| `src/lib/format.ts` | Montants MAD, pourcentages, parsing tolérant des saisies |
| `src/lib/selectors.ts` | Agrégations et indicateurs |
| `src/lib/palette.ts` | Palette catégorielle et couleurs de graphiques (clair/sombre) |
| `src/lib/theme.ts` | Thème effectif + application de `data-theme` |
| `src/components/ui/` | Primitives (carte, statistique, badge, jauge, modale, icônes) |
| `src/components/charts/` | Graphiques Recharts + barres HTML de composition |
| `src/pages/` | Dashboard, Transactions (revenus/dépenses), Budget, Épargne, Investissements, Patrimoine |

## Modèle de données

```ts
AppState {
  version: number
  categories:    Category[]        // kind: income | expense, nature: fixed | variable, couleur
  transactions:  Transaction[]     // kind, amount, date, categoryId, description, nature
  budgets:       Budget[]          // month (YYYY-MM), categoryId, amount
  savingsGoals:  SavingsGoal[]     // name, targetAmount, targetDate?
  savingsEntries:SavingsEntry[]    // date, amount (négatif = retrait), goalId | null
  investments:   Investment[]      // type, quantity, purchasePrice, currentPrice
  assets:        Asset[]           // type (cash, bank, savings, vehicle, realestate, other), value
  debts:         Debt[]            // balance, rate?, monthlyPayment?
  snapshots:     NetWorthSnapshot[]// month, assets, debts — historique du patrimoine
  settings:      Settings          // devise, objectif de taux d'épargne, thème
}
```

Chaque collection est un tableau d'objets porteurs d'un `id`, ce qui permet une
seule paire d'actions génériques (`upsert`, `remove`) et rend l'ajout d'une
nouvelle entité (crédits, revenus récurrents, comptes multiples…) trivial :
ajouter le type, la collection, une page — le reste ne bouge pas.

## Règles de calcul

| Indicateur | Formule |
|---|---|
| Épargne du mois | revenus du mois − dépenses du mois |
| Taux d'épargne | épargne ÷ revenus × 100 |
| Dépenses fixes | somme des opérations dont `nature = fixed` |
| Consommation d'un budget | dépenses de la catégorie ÷ budget du mois (statut : ok < 85 % ≤ bientôt atteint ≤ 100 % < dépassement) |
| Valeur d'une ligne d'investissement | quantité × prix actuel |
| Plus/moins-value | (prix actuel − prix d'achat) × quantité |
| **Patrimoine net** | actifs saisis + valeur du portefeuille − dettes |
| Historique du patrimoine | photographies mensuelles enregistrées + mois en cours calculé en direct |

Le portefeuille d'investissement est **injecté automatiquement** dans les actifs :
il n'est jamais saisi deux fois, ce qui évite tout double comptage.

## Graphiques

- Séries temporelles (patrimoine, revenus/dépenses, épargne) : Recharts, marques
  fines, grille discrète, infobulle commune.
- Compositions (catégories, allocation d'actifs) : barres HTML avec libellé et
  valeur toujours lisibles.
- Palette catégorielle de 8 teintes attribuées dans un ordre fixe, avec des pas
  distincts pour le mode clair et le mode sombre (validés pour le daltonisme et
  le contraste). Au-delà de 8 catégories affichées, les plus petites sont
  regroupées plutôt que de recycler une teinte.
- La couleur suit toujours l'entité (une catégorie garde sa teinte quels que
  soient les filtres) et n'est jamais le seul canal d'information : un libellé
  accompagne systématiquement la marque colorée.

## Évolutions faciles à brancher

- **Synchronisation** : implémenter `loadState`/`saveState` contre une API.
- **Revenus et dépenses récurrents** : nouvelle collection + génération à l'ouverture.
- **Multi-devises** : `Settings.currency` existe déjà ; ajouter un taux par opération.
- **Import bancaire (CSV)** : convertir vers `Transaction[]` et appeler `upsert`.
