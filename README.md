# NEXORA MOBILITY

Application web Passager basée sur la démo fournie : React, TypeScript, Vite et Supabase. Le dépôt est la source du code; l’aperçu Manus reste séparé.

## Prérequis et lancement

- Node.js 22 ou supérieur
- pnpm 11.25.0, version déclarée dans `package.json`

```bash
pnpm install
pnpm dev
```

Le serveur de développement écoute sur le port `3000`. Vite charge automatiquement `.env.development` en mode développement; ce fichier contient les valeurs publiques nécessaires au Codespace Nexora. Pour une configuration locale personnalisée, copier `.env.example` vers `.env.development.local` et renseigner les variables. Les fichiers `.env.local` et `.env.development.local` restent ignorés par Git.

## Configuration Supabase

Le client lit `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`. Le fichier `.env.development` versionné cible le projet `nexora-mobility` dans `eu-west-3` (Paris) et utilise une clé `sb_publishable_`, conçue pour être distribuée au client/browser. RLS reste la protection des données. Aucune clé `service_role` n’est incluse dans le frontend, le fichier de développement ou le dépôt.

Dans un Codespace déjà ouvert avant cette mise à jour, synchroniser `main` (`git pull`) puis arrêter et relancer `pnpm dev` afin que Vite recharge les variables d’environnement. Pour un build de production ou un hébergement séparé, configurer explicitement les deux variables dans l’environnement de déploiement; `.env.development` ne remplace pas cette configuration.

Les cinq migrations numérotées de `supabase/migrations/` correspondent aux migrations appliquées via le connecteur Supabase. Le schéma comporte profils, chauffeurs, véhicules, courses et événements append-only; aucune donnée de démonstration, offre, transaction ou valeur de solde n’est insérée.

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

Le travail est suivi dans des branches et PR visant `main`. Ajouter la configuration frontend publique ne déploie pas l’application.
