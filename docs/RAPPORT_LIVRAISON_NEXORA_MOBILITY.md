# Rapport de livraison — NEXORA MOBILITY

**Date :** 29 octobre 2026
**Dépôt :** [`m5ccfyyz67-boop/Nexora`](https://github.com/m5ccfyyz67-boop/Nexora)
**Branche livrée :** `feat/passenger-foundation`
**Intégration :** [PR #1 vers `main`](https://github.com/m5ccfyyz67-boop/Nexora/pull/1)
**Backend :** projet Supabase `nexora-mobility`, région `eu-west-3` (Paris)

## Synthèse

Le premier lot de NEXORA MOBILITY est réalisé : une application Passager React/TypeScript inspirée de la démo fournie est raccordée au socle Supabase. La demande de course et son annulation pré-attribution sont des opérations backend contrôlées et idempotentes. Les chiffres et comportements de démonstration n’ont pas été importés comme données réelles. L’intégration GitHub passe par la PR #1 vers `main`; cette livraison ne constitue pas une mise en production.

## Travail livré

### Frontend Passager

L’application comprend l’accueil, l’inscription/connexion par email et mot de passe, le formulaire de réservation VTC (départ, destination et catégories Économique, Confort et Premium), le suivi de demande, l’historique, le portefeuille/les forfaits et le profil. L’interface est responsive et reprend la direction sombre et or de la démo.

Les écrans affichent explicitement les fonctions non configurées. Une demande enregistrée n’est pas présentée comme attribuée à un chauffeur; aucun GPS, ETA, trajet cartographique, prix, solde ou forfait fictif n’est présenté comme réel. Une demande encore en recherche et sans chauffeur peut être annulée par son passager; une demande attribuée ne peut pas être annulée par cette règle provisoire.

### Backend Supabase

Le socle comporte les profils Passager, profils Chauffeur, véhicules, courses et événements append-only. RLS limite les lectures aux propriétaires et participants. Les écritures métier passent par des RPC qui vérifient l’identité et les transitions autorisées. Une clé de requête rend la création de course idempotente, y compris en cas de retries concurrents; la répétition d’une annulation ne crée pas un nouvel événement.

Les cinq migrations suivantes sont confirmées dans l’historique du projet :

| Version | Migration | Objet |
| --- | --- | --- |
| `20261028143038` | `initial_nexora_schema_20261028` | Profils, chauffeurs, véhicules, courses, événements, RLS et transitions chauffeur. |
| `20261028143353` | `ride_request_idempotency_20261028` | Identifiant client de reprise et unicité de requête. |
| `20261028143451` | `tighten_nexora_rpc_privileges_20261028` | Permissions RPC, mise à jour limitée des profils et index d’audit. |
| `20261028144107` | `atomic_ride_request_idempotency_20261028` | Reprise atomique des demandes simultanées. |
| `20261028144519` | `passenger_cancel_unassigned_request_20261028` | Annulation idempotente d’une demande sans chauffeur. |

### Dépôt et aperçu

Le dépôt utilisateur `Nexora` est la source de code; le projet d’aperçu Manus est distinct et ne remplace pas son dépôt Git. `.env.local` est ignoré par Git; seul le modèle `.env.example` est versionné. Le rapport, le [README](../README.md), le [plan](../plan.md) et le [suivi](../TODO.md) sont inclus dans le dépôt.

## Vérifications effectuées

- `pnpm test` : 4 tests passent, couvrant les états actifs/terminaux, les libellés et la règle d’annulation.
- `pnpm typecheck` : réussi.
- `pnpm build` : réussi.
- Aperçu local : page d’accueil et `/manus-routes.json` répondent en HTTP 200; le manifeste JSON contient la route `/`.
- Supabase : cinq migrations confirmées; aucun accès RPC au rôle `anon` détecté par le contrôle de sécurité.
- GitHub : le dernier commit poussé est sur `feat/passenger-foundation`; GitHub ne rapporte aucun contrôle CI sur la branche au moment de la vérification. La PR #1 cible `main`.

Ces contrôles sont principalement statiques et de build. Aucune inscription avec un compte réel ni aucun scénario transactionnel automatisé sur des données de production n’a été réalisé.

## Sécurité et points à surveiller

Le conseil Supabase signale **quatre avertissements** parce que les RPC `SECURITY DEFINER` doivent être appelables par les rôles authentifiés pour réaliser les opérations contrôlées. Le rôle `anon` est explicitement révoqué et les fonctions vérifient l’identité appelante et les règles métier. Le conseil de performance signale également **six index inutilisés** sur le schéma neuf; leur utilité devra être réévaluée lorsque des données et requêtes réelles existeront. Ces résultats ne valent pas audit complet ni homologation de production.

## Décisions et travaux restant à valider

1. Choisir le fournisseur d’authentification définitif, les règles de confirmation email et les URL de redirection autorisées, puis tester le cycle réel d’inscription/connexion.
2. Choisir la cartographie et le géocodage, définir l’estimation du trajet, le dispatch, les états opérationnels chauffeur et les règles d’annulation après attribution.
3. Valider le modèle des kilomètres : unité, forfaits, prix, validité, wallet, ledger, transfert entre comptes et traitement des remboursements.
4. Sélectionner et configurer les moyens de paiement et les notifications; aucune transaction réelle n’est activée dans ce lot.
5. Compléter les parcours Chauffeur et administration, puis réaliser une revue de sécurité et des tests d’intégration avant tout lancement.

**État de publication :** aucun déploiement public ou basculement en production n’a été demandé ou effectué. La fusion de la PR vers `main` ne doit pas être assimilée à une mise en production.
