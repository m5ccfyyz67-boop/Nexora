# Suivi — premier lot NEXORA MOBILITY

## 1. Application Passager React dans le dépôt choisi — complétée

- Le dépôt source est `m5ccfyyz67-boop/Nexora`; les changements sont sur `feat/passenger-foundation` et la PR #1 vise `main`. L’ancien dépôt `nexora-mobility` n’est ni utilisé ni supprimé.
- L’application reprend l’identité sombre et dorée ainsi que les parcours du prototype joint, sans convertir en vraies données ses noms, soldes, historiques, distances, prix ou durées.
- La navigation s’adapte au mobile et au desktop et fournit l’accueil, la réservation VTC avec départ, destination et catégories Économique/Confort/Premium, l’état de la demande, l’historique, le portefeuille/forfaits et le profil.
- Les écrans montrent des chargements, erreurs et états vides; une capacité non configurée est décrite comme telle plutôt que simulée. Une demande annulée n’est pas affichée à tort comme une demande active sur l’accueil.
- Le partage opérationnel de kilomètres, Moto, Livraison, Chauffeur et administration ne sont pas activés dans ce premier lot; aucune opération de transfert n’est simulée.

## 2. Socle Supabase versionné et sécurisé — appliqué et contrôlé

- Les cinq migrations non destructives de `supabase/migrations/` sont appliquées au projet `nexora-mobility` dans `eu-west-3` : profils, profils Chauffeur, véhicules, courses, enums d’état, événements de transition append-only, reprises idempotentes, permissions et annulation sûre.
- Les courses utilisent des états contrôlés; la demande passager exige une session, valide les libellés et n’est pas présentée comme attribuée, en route ou terminée sans confirmation correspondante du backend.
- RLS est activé sur toutes les tables exposées; les lectures de profil sont limitées au compte authentifié et les courses/événements aux participants.
- Les RPC de demande, d’acceptation, de transition et d’annulation vérifient l’appelant et les règles métier; le rôle `anon` ne peut pas les exécuter. Une clé de demande répétée retourne la même course et n’ajoute pas d’événement supplémentaire. Le passager peut annuler de façon idempotente une course uniquement tant qu’elle est en recherche et sans chauffeur; aucune annulation après attribution n’est permise.
- Aucun tarif de production, forfait, valeur de solde, transaction, utilisateur ou jeu de données fictif n’est inséré comme donnée réelle; aucune clé `service_role` n’est intégrée au frontend, au dépôt ou à l’historique Git.
- Le conseil Supabase ne rapporte aucun accès `anon` aux RPC, mais signale quatre avertissements pour les RPC `SECURITY DEFINER` nécessaires aux utilisateurs authentifiés et six index encore inutilisés sur les tables neuves. Ces points restent à réexaminer lors de la revue avant production; ils ne constituent pas une homologation de production.

## 3. Configuration Supabase du frontend — configurée et aperçu contrôlé

- `@supabase/supabase-js` utilise l’URL et la clé publiable depuis `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `.env.example` contient des exemples non secrets; `.env.local` est ignoré par Git et reste hors du dépôt.
- Une configuration manquante produit un écran explicite; le frontend ne simule pas une connexion réussie.
- Le branchement email/mot de passe est provisoire et affiché comme tel; la méthode finale, les règles de vérification email, les URL de redirection Auth et les rôles d’exploitation restent à confirmer. Le parcours n’a pas fait l’objet d’un test d’inscription avec un compte réel.
- Les permissions d’administration ne sont pas accordées au client navigateur.

## 4. Parcours Passager raccordés au socle — implémentés et tests unitaires passés

- Le formulaire requiert un départ et une destination de 2 à 300 caractères et une catégorie Économique, Confort ou Premium.
- La demande est créée par RPC et l’interface n’indique sa réussite qu’après la réponse du serveur; l’identifiant stable permet une reprise sûre après perte réseau ou double envoi concurrent.
- Le passager peut annuler une demande uniquement si son état est `searching` et aucun chauffeur n’est affecté; la base revalide cette règle et journalise l’événement. L’annulation est répétable sans événement supplémentaire.
- Le suivi n’affiche aucun chauffeur, GPS, itinéraire, ETA, distance estimée ou prix fictif comme donnée réelle; il indique que la mise en relation et la cartographie ne sont pas activées.
- L’historique et le profil lisent les données du compte authentifié et affichent un état vide lorsqu’aucune course n’existe.
- Le portefeuille et les forfaits ne montrent aucun solde fictif et restent inactifs tant que le modèle kilométrique, le prix, la validité, le paiement et les règles de débit/transfert n’ont pas été approuvés.

## 5. Aperçu, documentation et demande de fusion — aperçu validé; PR #1 ouverte

- L’aperçu Manus reste séparé du dépôt GitHub; seules les sources nécessaires sont copiées dans le projet d’aperçu et son `.git` géré n’est pas remplacé.
- `public/manus-routes.json` déclare exactement la route de page implémentée (`/`); l’aperçu répond HTTP 200 pour la page et le manifeste JSON.
- `README.md` documente les prérequis, l’installation reproductible, les variables, le backend, les migrations, les commandes de vérification et les limites.
- `pnpm test` (4 tests), `pnpm typecheck` et `pnpm build` passent dans le dépôt source et la copie d’aperçu; les tests ciblent les états actifs/terminaux, leurs libellés et l’annulation pré-attribution.
- La PR [#1](https://github.com/m5ccfyyz67-boop/Nexora/pull/1) est ouverte vers `main`; le commit final de `feat/passenger-foundation` contient la correction de l’état actif et ce suivi. Aucune fusion ni publication de l’application n’est effectuée.
