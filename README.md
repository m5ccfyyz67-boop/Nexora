# NEXORA MOBILITY

Application Passager Nexora basée sur la démo fournie, avec un socle React/TypeScript et un backend Supabase.

## Prérequis

Node.js 22 ou supérieur et pnpm 11.25.0 (version déclarée dans `package.json`).

## Installation et lancement

```bash
pnpm install
cp .env.example .env.local
# Renseigner les variables Supabase dans .env.local
pnpm dev
```

Le serveur local écoute sur le port 3000. Ne publiez jamais `.env.local` dans Git. `VITE_SUPABASE_PUBLISHABLE_KEY` est une clé client publiable, pas une clé de privilège; la sécurité des données repose également sur RLS. Aucune clé `service_role` ne doit être présente côté navigateur.

## Base Supabase

Les migrations versionnées sont dans `supabase/migrations/`. Le schéma initial ne contient aucune donnée de démonstration et ne valide aucun tarif, forfait, paiement ou transfert de kilomètres. Les migrations doivent être appliquées au projet Supabase Nexora après revue; ne pas exécuter de migration destructive en production.

## Vérifications

```bash
pnpm typecheck
pnpm build
```

## Limites connues du premier lot

La démo fournie contient des données et interactions simulées. La cartographie, le géocodage, l’estimation routière, l’attribution opérationnelle d’un chauffeur, les paiements réels et la gestion commerciale des kilomètres ne sont pas activés par défaut. Les écrans doivent afficher ces limites au lieu de simuler une confirmation ou une position réelle.
