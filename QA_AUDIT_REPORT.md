# WayaCloud QA Audit Report

Date d'audit: 8 juin 2026  
Environnement teste: https://wayacloud-silk.vercel.app/  
Compte teste: graphistes6ns@gmail.com  
Navigateurs / vues: desktop via navigateur integre Codex. Controle mobile non termine car la session navigateur est devenue indisponible apres le test du lien de partage.  

Captures disponibles:

- `qa-screenshots/01-home-desktop.png`
- `qa-screenshots/04-login-success-stuck-modal.png`
- `qa-screenshots/09-mes-fichiers-q-docx.png`
- `qa-screenshots/12-files-search-no-match-after-wait.png`
- `qa-screenshots/17-docx-preview.png`
- `qa-screenshots/18-share-from-preview.png`
- `qa-screenshots/19-share-link-open.png`

## Critical Issues

### 1. Les liens de partage generes retournent une page 404

- Page URL: `https://wayacloud-silk.vercel.app/mes-fichiers`
- Feature name: Partage de fichier
- Steps to reproduce:
  1. Se connecter.
  2. Ouvrir `Mes fichiers`.
  3. Ouvrir les actions du fichier `WayaCloud_Implementation_Plan_EN.docx`.
  4. Cliquer sur `Apercu`, puis `Partager`.
  5. Copier ou ouvrir le lien genere.
- Expected behavior: Le lien public doit ouvrir une page de partage permettant de consulter ou telecharger le fichier selon les permissions.
- Actual behavior: Le lien genere ressemble a `/share/{fileId}?expires=7d&type=public` et ouvre une page `404 Page introuvable`.
- Severity: Critical
- Possible root cause: `components/files/ShareDialog.tsx` construit un faux lien `/share/${file.id}` cote client, alors que la route publique existante est `app/s/[token]` et que `app/api/share/route.ts` retourne un lien `/s/{token}`. Le modal ne semble pas appeler l'API de creation de lien partage.
- Screenshot: `qa-screenshots/18-share-from-preview.png`, `qa-screenshots/19-share-link-open.png`

### 2. L'API de creation de liens partages risque de toujours echouer en production

- Page URL: `https://wayacloud-silk.vercel.app/api/share`
- Feature name: API de partage
- Steps to reproduce:
  1. Depuis le code, inspecter `app/api/share/route.ts`.
  2. Observer que la route cree un client admin puis appelle `supabase.auth.getUser()` sans jeton utilisateur.
- Expected behavior: La route doit authentifier l'utilisateur courant via les cookies/session SSR ou via le bearer token, puis verifier la propriete du fichier.
- Actual behavior: Avec un client admin sans token utilisateur explicite, `auth.getUser()` ne represente pas la session utilisateur courante. La route peut retourner `401 Authentification requise` meme pour un utilisateur connecte.
- Severity: Critical
- Possible root cause: Confusion entre client service-role admin et client SSR authentifie. Il faut recuperer l'utilisateur avec un client SSR/cookies, puis utiliser le client admin uniquement pour les operations privilegiees strictement necessaires.

## High Priority Issues

### 1. Creation de dossier non fonctionnelle et basee sur `prompt()`

- Page URL: `https://wayacloud-silk.vercel.app/dashboard`
- Feature name: Acces rapide `Nouveau dossier`
- Steps to reproduce:
  1. Se connecter.
  2. Sur le dashboard, cliquer `Nouveau dossier`.
- Expected behavior: Ouvrir un modal propre permettant de saisir un nom de dossier, valider, afficher un etat de chargement, puis creer le dossier.
- Actual behavior: Une erreur console est declenchee: `Error: prompt() is not supported`. Le code local montre aussi que la fonctionnalite affiche seulement un message `Fonctionnalite de creation de dossier bientot disponible`.
- Severity: High
- Possible root cause: Usage de `prompt()` dans `app/(dashboard)/dashboard/page.tsx` et absence d'implementation backend de creation de dossier.
- Screenshot: `qa-screenshots/07-new-folder-result.png`

### 2. Recherche globale redirige vers `Mes fichiers` mais le parametre `q` n'est pas applique correctement

- Page URL: `https://wayacloud-silk.vercel.app/dashboard`
- Feature name: Recherche globale
- Steps to reproduce:
  1. Depuis le dashboard, saisir `docx` dans la recherche globale.
  2. Appuyer sur `Enter`.
  3. Observer `/mes-fichiers?q=docx`.
- Expected behavior: La page `Mes fichiers` doit afficher uniquement les fichiers correspondant a `docx`.
- Actual behavior: Apres chargement, la page affiche tous les fichiers au lieu des resultats filtres.
- Severity: High
- Possible root cause: Le composant de liste de fichiers ne consomme pas correctement `searchParams.q`, ou le store recharge tous les fichiers apres l'hydratation sans reappliquer le filtre.
- Screenshot: `qa-screenshots/09-mes-fichiers-q-docx.png`

### 3. Recherche locale des fichiers a des etats incoherents

- Page URL: `https://wayacloud-silk.vercel.app/mes-fichiers`
- Feature name: Recherche dans la liste de fichiers
- Steps to reproduce:
  1. Ouvrir `Mes fichiers`.
  2. Saisir `docx`, puis un terme sans correspondance comme `zzzz-no-match`.
  3. Observer les compteurs et l'etat vide.
- Expected behavior: Le compteur et la liste doivent changer immediatement et de facon coherente.
- Actual behavior: La table disparait temporairement, le compteur passe parfois par des valeurs incorrectes, puis l'etat vide apparait apres delai. Effacer le champ n'a pas correctement remis l'etat a zero pendant le test.
- Severity: High
- Possible root cause: Etat de recherche controle de facon asynchrone, debounce ou store global non synchronise avec le champ de recherche.
- Screenshot: `qa-screenshots/10-files-local-search-docx.png`, `qa-screenshots/12-files-search-no-match-after-wait.png`

### 4. Plusieurs instances Supabase Auth dans le meme contexte navigateur

- Page URL: `https://wayacloud-silk.vercel.app/dashboard`
- Feature name: Authentification / session
- Steps to reproduce:
  1. Se connecter.
  2. Ouvrir la console navigateur.
- Expected behavior: Une seule instance Supabase Auth partageant le meme storage key.
- Actual behavior: Warning console: `Multiple GoTrueClient instances detected in the same browser context`.
- Severity: High
- Possible root cause: `createClient()` est appele au niveau module dans plusieurs fichiers (`lib/auth/service.ts`, `providers/AuthProvider.tsx`, pages/composants). Centraliser une instance navigateur ou creer les clients dans des hooks memoises reduirait le risque de comportement concurrent.

### 5. Page `Mes Partages` ne reflete pas les partages existants ou generes

- Page URL: `https://wayacloud-silk.vercel.app/partages`
- Feature name: Gestion des partages
- Steps to reproduce:
  1. Generer un lien de partage depuis un fichier.
  2. Ouvrir `Partages`.
- Expected behavior: Voir la liste des liens actifs, leurs expirations, permissions, revocation et statistiques.
- Actual behavior: La page affiche un etat vide statique `Aucun fichier partage`.
- Severity: High
- Possible root cause: Page non connectee a la table `share_links`; fonctionnalite d'administration des partages non implementee.

### 6. Sauvegarde WhatsApp simule une progression au lieu d'executer un vrai workflow

- Page URL: `https://wayacloud-silk.vercel.app/whatsapp?scan=1`
- Feature name: Sauvegarde WhatsApp
- Steps to reproduce:
  1. Depuis le dashboard, cliquer `Sauvegarder WhatsApp`.
  2. Observer le workflow de scan/upload.
- Expected behavior: Declencher une vraie analyse ou afficher clairement les prerequisites mobiles/import.
- Actual behavior: Le code local montre une progression aleatoire avec `setTimeout` et `Math.random()`, sans upload reel cote web.
- Severity: High
- Possible root cause: Prototype UI branche sur une simulation; integration mobile/backend incomplete.

## Medium Priority Issues

### 1. Boutons rapides du dashboard incomplets

- Page URL: `https://wayacloud-silk.vercel.app/dashboard`
- Feature name: Acces rapides
- Steps to reproduce:
  1. Cliquer `Partager un lien`.
  2. Cliquer `Album partage`.
- Expected behavior: Les actions doivent ouvrir des workflows contextualises.
- Actual behavior: `Partager un lien` ouvre un partage generique vers `/partages`, pas un fichier ou un objet selectionne. `Album partage` redirige vers une page vide sans bouton de creation.
- Severity: Medium
- Possible root cause: Raccourcis connectes a des placeholders au lieu de workflows complets.

### 2. Page Albums uniquement en etat vide

- Page URL: `https://wayacloud-silk.vercel.app/albums`
- Feature name: Albums
- Steps to reproduce:
  1. Ouvrir `Albums`.
- Expected behavior: Bouton `Creer un album`, liste des albums, gestion photos/videos.
- Actual behavior: Etat vide statique sans action visible.
- Severity: Medium
- Possible root cause: Page non connectee a un store/API albums.

### 3. Apercu DOCX limite a des metadonnees

- Page URL: `https://wayacloud-silk.vercel.app/mes-fichiers`
- Feature name: Apercu fichier
- Steps to reproduce:
  1. Ouvrir l'apercu du fichier `.docx`.
- Expected behavior: Apercu du document ou message clair `Apercu non disponible`, avec telechargement.
- Actual behavior: Le panneau affiche seulement une icone et des metadonnees.
- Severity: Medium
- Possible root cause: Pas de viewer document/PDF integre ni fallback explicite.
- Screenshot: `qa-screenshots/17-docx-preview.png`

### 4. Actions fichier destructives sans confirmation visible dans le panneau d'apercu

- Page URL: `https://wayacloud-silk.vercel.app/mes-fichiers`
- Feature name: Suppression / corbeille
- Steps to reproduce:
  1. Ouvrir l'apercu d'un fichier.
  2. Observer le bouton `Supprimer`.
- Expected behavior: Confirmation claire avant mise a la corbeille ou suppression.
- Actual behavior: Le bouton appelle directement `onDelete?.(file)` selon le code local.
- Severity: Medium
- Possible root cause: Absence de confirmation dans `components/dashboard/FilePreviewPanel.tsx`.

### 5. Gestion des erreurs upload invisible pour l'utilisateur

- Page URL: `https://wayacloud-silk.vercel.app/mes-fichiers`
- Feature name: Upload fichier
- Steps to reproduce:
  1. Declencher un upload qui echoue cote `/api/upload/presign` ou stockage.
- Expected behavior: Toast explicite, retry, details simples.
- Actual behavior: Le code de `app/(dashboard)/mes-fichiers/page.tsx` logge `Upload error` dans la console mais n'affiche pas de toast utilisateur.
- Severity: Medium
- Possible root cause: Catch silencieux cote UI.

### 6. Renommage dans les fichiers recents utilise aussi `prompt()`

- Page URL: `https://wayacloud-silk.vercel.app/dashboard`
- Feature name: Fichiers recents / Renommer
- Steps to reproduce:
  1. Ouvrir le menu `Actions` d'un fichier recent.
  2. Cliquer `Renommer`.
- Expected behavior: Modal de renommage accessible et valide.
- Actual behavior: Le code local utilise `prompt("Nouveau nom :", file.name)`.
- Severity: Medium
- Possible root cause: Ancien pattern prototype conserve dans `components/dashboard/RecentFilesList.tsx`.

## Low Priority Issues

### 1. Lien des conditions d'utilisation inactif

- Page URL: `https://wayacloud-silk.vercel.app/`
- Feature name: Auth modal / Conditions d'utilisation
- Steps to reproduce:
  1. Ouvrir le modal de connexion.
  2. Cliquer `conditions d'utilisation`.
- Expected behavior: Ouvrir une page legal/terms.
- Actual behavior: Le lien pointe vers `#`.
- Severity: Low
- Possible root cause: Lien placeholder non remplace.
- Screenshot: `qa-screenshots/01-home-desktop.png`

### 2. Texte et encodage francais corrompus a plusieurs endroits

- Page URL: Plusieurs pages
- Feature name: UI copy
- Steps to reproduce:
  1. Observer les textes dans le code et certains rendus.
- Expected behavior: Accents francais corrects.
- Actual behavior: Plusieurs chaines apparaissent sous forme `CrÃ©er`, `rÃ©initialisÃ©`, `FonctionnalitÃ©`.
- Severity: Low
- Possible root cause: Fichiers source ou terminal en encodage incorrect; verifier UTF-8 partout.

### 3. Affichage stockage incoherent

- Page URL: `https://wayacloud-silk.vercel.app/dashboard`
- Feature name: Widget stockage
- Steps to reproduce:
  1. Se connecter.
  2. Comparer le widget stockage et la liste des fichiers.
- Expected behavior: Taille utilisee coherente avec les fichiers affiches.
- Actual behavior: Dashboard montre des fichiers recents et types de fichiers, mais le stockage indique `0.0 Go / 5.0 Go`.
- Severity: Low
- Possible root cause: Arrondi trop agressif en Go pour de petits fichiers ou source de donnees differente.

## UI/UX Improvements

- Remplacer tous les `prompt()` par des modals accessibles avec validation, boutons annuler/confirmer, et etats de chargement.
- Ajouter un vrai etat de chargement pendant la redirection apres login. Le toast `Connexion reussie` apparait avant que l'utilisateur quitte le modal, ce qui peut donner une impression de blocage pendant quelques secondes.
- Ajouter des boutons d'action sur les etats vides: `Creer un album`, `Partager un fichier`, `Importer un fichier`.
- Afficher un message clair pour les apercus non pris en charge: `L'apercu de ce format n'est pas encore disponible`.
- Clarifier les compteurs de stockage pour les petits volumes, par exemple afficher `8.1 Mo` au lieu de `0.0 Go`.
- Ajouter des libelles accessibles aux boutons icones sans texte visible (`Vue liste`, fermeture de panneau, copier).

## Performance Issues

- La page `Mes fichiers` a montre un delai visible avant que les 8 fichiers apparaissent, avec un passage temporaire a `0 fichiers`.
- Plusieurs captures plein ecran ont ete lentes sur la page fichiers, ce qui peut indiquer un rendu lourd ou des panneaux fixes couteux.
- Les multiples instances Supabase Auth peuvent augmenter les appels de session et provoquer des refresh concurrents.

## Security Concerns

- Les URL pre-signees Wasabi/S3 apparaissent directement dans le DOM du panneau d'apercu. Elles expirent, mais doivent rester courtes, non journalisees et non exposees dans des analytics.
- La route `app/api/share/route.ts` melange client admin/service-role et authentification utilisateur. Cela augmente le risque d'erreur d'autorisation si la route est modifiee plus tard.
- Les actions de suppression/mise a la corbeille n'ont pas de confirmation visible dans le panneau d'apercu.
- Les liens de partage generes cote client avec `file.id` ne creent pas de token serveur, ne respectent pas vraiment l'expiration et donnent une fausse impression de controle d'acces.

## Recommendations

1. Corriger le partage en priorite:
   - Le modal doit appeler `POST /api/share`.
   - L'API doit authentifier via session SSR/cookies.
   - Le lien retourne doit utiliser `/s/{token}`.
   - La page `/partages` doit lister les liens actifs depuis `share_links`.

2. Stabiliser l'architecture auth:
   - Eviter les clients Supabase crees au niveau module dans plusieurs composants.
   - Centraliser le client navigateur ou utiliser une factory memoisee.
   - Verifier les flows signup/reset apres correction SMTP/Supabase.

3. Remplacer les prototypes:
   - `prompt()` pour dossier/renommage.
   - Progression WhatsApp aleatoire.
   - Pages Albums/Partages statiques.

4. Reparer recherche et filtres:
   - Appliquer `q` depuis l'URL.
   - Synchroniser champ, store et compteur.
   - Ajouter tests E2E pour recherche avec resultats et sans resultats.

5. Ajouter tests automatises:
   - Login email/password.
   - Creation de lien partage et ouverture publique.
   - Recherche fichiers.
   - Upload success/failure.
   - Renommage, favori, details, corbeille avec confirmation.
   - Responsive mobile pour homepage, login, dashboard, fichiers.

6. Completer l'audit mobile:
   - Largeurs recommandees: 390x844, 768x1024, 1280x720.
   - Verifier sidebar, header dashboard, modals, tables de fichiers, panneau d'aperçu.

