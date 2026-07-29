# Exemples d'issues — repo `ALPE-Plaisance-du-Touch/Gestionnaire-de-Bourse-ALPE`

3 exemples couvrant les cas principaux : **bug**, **user story (enhancement)**, **question / investigation**. Calqués sur les conventions du repo.

---

## Exemple 1 — `bug` (régression navigateur)

**Titre** : `Le scan code-barres échoue sur la page de vente sous Firefox`

**Labels** : `bug`, `sales`

**Body** :

```markdown
## Contexte / Repro

Le scan de code-barres en encaissement échoue sous Firefox alors qu'il
fonctionne sous Chrome. Reproduit en environnement de dev.

Étapes :
1. Ouvrir la page de vente bénévole sous Firefox
2. Scanner l'étiquette d'un article
3. Le champ ne se remplit pas — aucun article n'est ajouté au panier

## Comportement attendu vs observé

- **Attendu** : l'article scanné est reconnu et ajouté au panier, comme sous Chrome
- **Observé** : pas de capture, pas d'erreur visible côté UI

## Tâches

- [ ] Diagnostiquer la différence de gestion d'événement clavier/scanner Firefox vs Chrome
- [ ] Corriger la capture dans le composant de scan
- [ ] Vérifier la non-régression sous Chrome / Edge

## Critères d'acceptation

- [ ] Le scan code-barres ajoute l'article au panier sous Firefox (dernière version ESR)
- [ ] Le comportement est identique à Chrome
- [ ] Aucune régression sur les autres navigateurs

## Liens

- Page : [SalesPage.tsx](frontend/src/pages/volunteer/SalesPage.tsx)
- Composant : [frontend/src/components/sales/](frontend/src/components/sales/)
```

---

## Exemple 2 — `enhancement` + `user-story` (nouvelle capacité)

**Titre** : `Bouton « Exporter les paiements en Excel »`

**Labels** : `enhancement`, `payouts`, `user-story`

**Body** :

```markdown
## User Story

> **En tant que** gestionnaire d'une édition clôturée,
> **je veux** exporter la liste des reversements au format Excel
> **afin que** je puisse les archiver et les transmettre à la trésorerie ALPE.

Cas d'usage :
- Préparer le versement aux déposants après le bilan d'une édition
- Archiver la comptabilité de l'édition hors de l'application

## Périmètre

### Inclus (V1)
- Bouton « Exporter en Excel » sur la page de reversements d'une édition
- Une ligne par déposant : numéro de liste, montant brut, commission, net à reverser
- Disponible uniquement aux rôles gestionnaire et administrateur

### Hors scope V1
- Export PDF (les reçus PDF existent déjà par déposant)
- Filtrage avancé / colonnes configurables

## Critères d'acceptation

- [ ] Un bouton « Exporter en Excel » est visible sur la page de reversements
- [ ] Le clic télécharge un fichier `.xlsx` avec un nom explicite (édition + date)
- [ ] Les montants correspondent au calcul de commission affiché à l'écran
- [ ] Accès refusé aux rôles déposant et bénévole

## Liens

- Backend : [payouts.py](backend/app/api/v1/endpoints/payouts.py)
- Frontend : [frontend/src/components/payouts/](frontend/src/components/payouts/)
- Service PDF existant (référence format reçu) : [pdf.py](backend/app/services/pdf.py)
```

---

## Exemple 3 — `question` / investigation (décision d'archi)

**Titre** : `Billetweb — fiabiliser la synchronisation incrémentale des inscriptions`

**Labels** : `question`, `billetweb`

**Body** :

```markdown
## Contexte

La synchronisation incrémentale Billetweb rate occasionnellement des
inscriptions modifiées après le premier import. Il faut décider d'une stratégie
de réconciliation fiable avant la prochaine édition.

État actuel :
- L'import API récupère les attendees via les champs `order_paid` / `disabled`
- Les champs custom (téléphone, code postal, ville) sont dans `custom_order`
- Une modification d'inscription côté Billetweb n'est pas toujours reprise

## Question à trancher

- Full-resync périodique vs delta basé sur un horodatage côté Billetweb ?
- Comment détecter une inscription annulée puis réactivée ?
- Quel impact sur les listes déjà déclarées par les déposants ?

## Sortie attendue

Une stratégie documentée (mécanisme de réconciliation + déclencheur) qui
sécurise l'import avant la prochaine édition, et la mise à jour de la note
technique correspondante.

## Critères d'acceptation

- [ ] La stratégie de synchronisation est choisie et justifiée
- [ ] Les cas annulation / réactivation sont couverts
- [ ] La décision est documentée

## Liens

- Backend : [billetweb.py](backend/app/api/v1/endpoints/billetweb.py)
- API Billetweb : https://www.billetweb.fr/bo/api.php
```
