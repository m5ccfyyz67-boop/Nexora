# NEXORA MOBILITY

Application web Passager basée sur la démo fournie : React, TypeScript, Vite et Supabase. Le dépôt est la source du code; l’aperçu Manus reste séparé.

## Prérequis et lancement local

- Node.js 22 ou supérieur
- pnpm 11.25.0, version déclarée dans `package.json`

```bash
pnpm install
cp .env.example .env.local
# Renseigner les variables Supabase dans .env.local
pnpm dev
```

Le serveur de développement écoute sur le port `3000`. Ne publiez jamais `.env.local` dans Git. `VITE_SUPABASE_PUBLISHABLE_KEY` est une clé destinée au client; elle ne remplace pas RLS. Aucune clé `service_role` ne doit être présente dans le navigateur.

## Configuration Supabase

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Le backend est le projet `nexora-mobility` dans la région `eu-west-3` (Paris). Les cinq migrations numérotées de `supabase/migrations/` correspondent aux migrations appliquées via le connecteur Supabase. Le schéma comporte profils, chauffeurs, véhicules, courses et événements append-only; aucune donnée de démonstration, offre, transaction ou valeur de solde n’est insérée.

Le parcours email/mot de passe est un branchement provisoire. Selon la configuration Auth du projet, une vérification email peut être exigée avant la première session. Le fournisseur final et les règles de vérification restent à confirmer.

## Commandes de vérification

```bash
pnpm test
pnpm typecheck
pnpm build
```

`pnpm test` exécute les tests Vitest des états de course et de l’annulation permise. `pnpm build` inclut également le contrôle TypeScript.

## Limites du premier lot

La démo fournie contenait des chauffeurs, des trajets, des historiques, un solde, des prix et des durées simulés. Ils ne sont pas importés comme données réelles. Une demande VTC peut être enregistrée par le backend, puis annulée par son passager tant qu’elle est encore en recherche et sans chauffeur. Le dispatch de chauffeur n’est pas activé : aucun chauffeur, GPS, ETA, calcul de prix ni itinéraire cartographique n’est simulé comme réel. L’annulation après attribution, les forfaits, le portefeuille, les débits/transferts de kilomètres et les paiements restent inactifs jusqu’à validation de leurs règles. Les parcours Chauffeur et administration sont ultérieurs.

Le conseil de sécurité Supabase peut signaler les RPC `SECURITY DEFINER` appelables par `authenticated` : elles sont nécessaires aux écritures contrôlées, vérifient le compte appelant et ne sont pas exécutables par `anon`. Cette observation doit être réévaluée avant mise en production; voir la documentation Supabase sur [les fonctions SECURITY DEFINER détectées par le linter](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

## Livraison

Le travail s’effectue sur `feat/passenger-foundation` avec une demande de fusion ciblant `main`. L’ouverture de la PR ne fusionne pas le code et ne publie pas l’application.
