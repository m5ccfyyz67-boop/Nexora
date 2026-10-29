# Plan d’implémentation — NEXORA MOBILITY

**Version :** 0.3
**Dépôt source :** `m5ccfyyz67-boop/Nexora`
**Branche de travail :** `feat/passenger-foundation` → PR cible `main`
**Backend :** projet Supabase `nexora-mobility`, organisation Rachid TIMITE, région `eu-west-3` (Paris)
**Périmètre :** premier lot frontend Passager et socle de données; projet d’aperçu Manus séparé du dépôt GitHub.

## Approche d’implémentation

L’application est une SPA React 19 + TypeScript + Vite. Elle reprend la démo fournie comme référence visuelle, mais remplace ses données de démonstration par les données du compte connecté ou par des états explicitement non configurés. Le build produit des fichiers statiques; aucun serveur applicatif Manus ni seconde base Manus n’est activé.

Supabase fournit l’authentification, PostgreSQL, RLS et les RPC métier. Le client navigateur utilise `@supabase/supabase-js` avec uniquement l’URL et une clé publiable provenant de variables d’environnement. La création d’une course passe par `create_ride_request`, qui vérifie la session, valide les champs et écrit course + événement dans une transaction. La clé d’idempotence unique par passager empêche de créer plusieurs courses lors de retries ou de requêtes concurrentes. Une seule demande non terminale peut exister par passager. Afin d’éviter de bloquer le compte, `cancel_ride_request` permet au passager d’annuler de façon idempotente une demande encore en recherche et sans chauffeur; l’annulation après attribution n’est pas activée faute de règles commerciales validées. Les lectures sont limitées aux lignes du compte par RLS.

L’authentification email/mot de passe constitue le branchement provisoire du premier lot; le fournisseur final et les règles de vérification restent à confirmer. Les écrans du premier lot sont : accueil, réservation VTC, état de la demande, historique, portefeuille/forfaits non activés et profil. Une demande enregistrée garde l’état `searching`; tant que dispatch, chauffeur, GPS, géocodage et cartographie ne sont pas configurés, l’interface ne prétend pas fournir un chauffeur, un itinéraire, une position ou une ETA.

Aucun montant de production, achat, débit, solde ou transfert de kilomètres n’est activé. Les forfaits et le portefeuille présentent des états « à confirmer » au lieu des valeurs simulées de la démo. Les écrans Chauffeur, l’administration, les notifications, le paiement et le partage opérationnel de kilomètres restent hors de ce premier lot, en attente des décisions métier correspondantes.

Le dépôt `Nexora` est la source de code. Le projet d’aperçu Manus reste distinct : une copie sans `.git` sert uniquement au serveur Preview; les commits et la PR sont faits dans `Nexora`. Aucun déploiement public ou fusion automatique n’est demandé.

## Structure du projet

- `src/App.tsx` : récupération de session Supabase, accueil, routage d’authentification et état de configuration manquante.
- `src/features/auth/AuthPanel.tsx` : inscription/connexion email-mot de passe avec erreurs explicites et confirmation email.
- `src/features/passenger/PassengerApp.tsx` : navigation mobile/desktop, réservation, annulation pré-attribution, suivi, historique, portefeuille/forfaits et profil Passager.
- `src/features/passenger/ride-state.ts` : libellés et règles d’état/annulation de course réutilisés par l’interface et les tests.
- `src/lib/supabase.ts` : client Supabase typé et configuration navigateur.
- `src/lib/rides.ts` : RPC de demande, annulation et lecture des courses du compte authentifié.
- `src/types/database.ts` : types TypeScript des tables, fonctions et enums utilisés.
- `src/styles.css` : système de styles responsive et accessible.
- `supabase/migrations/` : cinq migrations versionnées alignées sur l’historique de Supabase.
- `tests/ride-state.test.ts` : tests Vitest des états actifs/terminaux, des libellés et de l’annulation permise.
- `public/manus-routes.json` : manifeste des routes HTML de l’aperçu (`/`).
- `README.md`, `.env.example`, `TODO.md` : installation, configuration et critères d’acceptation.

## Direction artistique — fidèle à la démo

- **Mouvement :** interface mobile de mobilité premium nocturne, inspirée de la référence Nexora fournie.
- **Principes :** priorité au trajet, hiérarchie lisible, actions non ambiguës, valeurs commerciales jamais simulées.
- **Couleurs :** fond bleu-noir `#0E1117`, surfaces profondes `#141822`, or `#D4AF37` pour l’identité et l’action principale, ardoise pour les informations secondaires; les états ne reposent pas uniquement sur la couleur.
- **Mise en page :** navigation basse sur mobile; rail latéral et contenu fluide sur grand écran; pas de faux cadre de téléphone sur desktop.
- **Motifs :** cartes sombres aux liserés subtils, grille cartographique uniquement illustrative et toujours étiquetée « non configurée », pastilles de statut lisibles.
- **Interaction :** confirmer uniquement après réponse serveur; empêcher le double envoi; conserver la même clé de reprise après erreur réseau; annuler une demande uniquement avant attribution; signaler les capacités indisponibles.
- **Animation :** transitions courtes (150–220 ms), mouvement discret, aucun mouvement simulant un GPS; animations réduites selon `prefers-reduced-motion`.
- **Typographie :** DM Sans pour les libellés et textes d’interface, Manrope pour les titres; chiffres denses réservés aux distances/montants lorsqu’ils seront fournis par le backend; polices de repli système.
- **Essence de marque :** mobilité urbaine soignée pour les passagers d’Abidjan; personnalité précise, rassurante et moderne.
- **Voix :** directe, chaleureuse et honnête. Exemples : « Où souhaitez-vous aller ? » et « La demande sera enregistrée; la mise en relation n’est pas encore activée. »
- **Wordmark et marque :** mot-symbole NEXORA / MOBILITY, accompagné d’un monogramme N doré encadré comme repère d’interface provisoire; ce monogramme n’est pas présenté comme un logo officiel approuvé.
- **Couleur signature :** or Nexora `#D4AF37`, repris de la démo.

## Dépendances, sécurité et contraintes

Les dépendances frontend sont React, TypeScript, Vite, `@supabase/supabase-js`, `lucide-react` et Vitest; versions verrouillées par `pnpm-lock.yaml`. Les scripts autorisés sont déclarés dans `pnpm-workspace.yaml`. Les variables réelles résident dans `.env.local`, ignoré par Git; seul `.env.example` est versionné. Aucune clé `service_role` ou donnée personnelle fictive n’est incluse dans le dépôt.

Les migrations activent RLS; les profils et courses sont lus par leur propriétaire/participant. Les écritures privilégiées passent par des fonctions `SECURITY DEFINER` à `search_path` contrôlé, qui vérifient `auth.uid()` et les règles de transition. Le conseil Supabase signale ces RPC parce qu’elles sont exécutables par les utilisateurs authentifiés; elles ne sont pas accessibles au rôle anonyme. Cette revue n’équivaut pas à une homologation de production.

La cartographie, le géocodage, l’estimation de trajet, l’affectation d’un chauffeur, l’authentification finale, les politiques commerciales du kilomètre, les tarifs, la passerelle de paiement et les notifications restent à valider avant leur activation réelle.
