# Mémoire UI Spell Checker — Gestionnaire de Bourse ALPE

## Patterns d'erreurs récurrents

### Accents manquants (cause principale de toutes les erreurs)
Les accents sont systématiquement absents dans les fichiers produits pendant v0.21/v0.22.
Mots les plus souvent fautifs :
- `deposant` → `déposant`
- `recuper{er/e/es}` → `récupér{er/é/ées}`
- `termine{e/es}` → `terminée(s)`
- `genere{r/}` → `généré`
- `telechargement` → `téléchargement`
- `especes` → `espèces`
- `cheque` → `chèque`
- `accepte(s)` → `accepté(s)`, `refuse(s)` → `refusé(s)`
- `Vetements` → `Vêtements`, `Puericulture` → `Puériculture`
- `camera` → `caméra`
- `A traiter` → `À traiter`, `A archiver` → `À archiver`
- `succes` → `succès`
- `edition` → `édition` (majuscule ou pas selon contexte)
- `a reverser` / `a recuperer` → `à reverser` / `à récupérer`

## Fichiers à haute densité d'erreurs (prioritaires à corriger)
1. `backend/app/services/payout_pdf.py` — ~20 erreurs (PDF remis aux déposants)
2. `backend/app/services/closure_report_pdf.py` — ~19 erreurs (PDF gestionnaires)
3. `frontend/src/pages/admin/PayoutsManagementPage.tsx` — ~22 erreurs
4. `frontend/src/pages/admin/ReviewListsPage.tsx` — ~14 erreurs
5. `frontend/src/pages/admin/ReviewListDetailPage.tsx` — ~13 erreurs
6. `frontend/src/components/billetweb/BilletwebAttendeesSyncModal.tsx` — ~14 erreurs
7. `frontend/src/pages/volunteer/SalesPage.tsx` — ~7 erreurs

## Terminologie du domaine (voir docs/glossaire.md)
- `Déposant` (pas vendeur, pas participant)
- `Bénévole` (pas volontaire)
- `Reversement` (terme technique, sans accent — intention du domaine)
- `Bordereau de reversement`
- `Créneau de dépôt`
- `Liste 1000` / `Liste 2000` (noms propres, pas d'accent)
- `Édition` pour désigner une bourse
- `Modifier` préféré à `Éditer` pour les actions sur articles

## Cohérence des statuts (incohérence à surveiller)
- Statut `closed` d'une édition → libellé correct : **`Clôturée`** (féminin)
  - `EditionsListPage.tsx` lignes 17/27 a tort : utilise `'Clôturé'` (masculin)
  - `MyEditionsPage.tsx` ligne 12 idem

## Conventions de l'application
- Pas de système i18n — les chaînes françaises sont inline dans le JSX
- Backend PDF (WeasyPrint) : chaînes encodées directement dans les f-strings HTML Python
- Adresse `vous` (vouvoiement) utilisée de façon cohérente
- Titres de sections sans article (style uniforme) : `"Statistiques invitations"`, `"Gestion des éditions"`, etc.
- `format_price` dans `pdf.py` utilise `€`, dans `payout_pdf.py` utilise `EUR` — incohérence mineure

## Audit réalisé le 2026-02-26
Voir le rapport complet dans la session pour la liste exhaustive des 162 erreurs.
