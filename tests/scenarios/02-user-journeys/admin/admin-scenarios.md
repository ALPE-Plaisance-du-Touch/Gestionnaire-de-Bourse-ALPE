# Scenarios Administrateur (A-01 a A-EC03)

**Pre-requis pour tous** : connecte en tant qu'administrateur (`admin@alpe-bourse.fr` / `Admin123!`).
Utiliser la procedure `LOGIN` de `tests/helpers/mcp-actions.md`.

**Donnees** : `tests/data/users/accounts.json` → `admin`

---

## A-01 : Creer une nouvelle edition

```
1. # Se connecter en tant qu'admin
2. navigate_page(url="http://localhost:5173/editions")
3. take_snapshot()
4. click(uid=new_edition_button)
5. take_snapshot()
6. fill(uid=edition_name_field, value="Bourse Automne 2026")
7. fill(uid=edition_location_field, value="Salle des fetes")
8. fill(uid=start_date_field, value="2026-10-15T09:00")
9. fill(uid=end_date_field, value="2026-10-18T18:00")
10. click(uid=create_edition_button)
11. take_snapshot()
12. ASSERT: edition creee, statut = "brouillon"
13. ASSERT: redirection vers le detail de l'edition
```

## A-02 : Supprimer une edition brouillon

**Pre-requis** : edition en statut brouillon.

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/editions")
3. take_snapshot()
4. Trouver uid du bouton "Supprimer" sur l'edition brouillon
5. click(uid=delete_edition_button)
6. take_snapshot()
7. ASSERT: modal de confirmation
8. click(uid=confirm_delete_button)
9. take_snapshot()
10. ASSERT: edition supprimee de la liste
```

## A-03 : Cloturer une edition

**Pre-requis** : edition en cours avec tous les prerequis de cloture remplis (reversements calcules, paiements finalises).

```
1. # Se connecter + naviguer vers le detail de l'edition
2. navigate_page(url="http://localhost:5173/editions/{edition_id}")
3. take_snapshot()
4. Trouver uid du bouton "Cloturer"
5. click(uid=close_edition_button)
6. take_snapshot()
7. ASSERT: verification des prerequis affichee (tous coches)
8. click(uid=confirm_close_button)
9. take_snapshot()
10. ASSERT: edition cloturee, statut = "closed"
```

## A-04 : Archiver une edition

**Pre-requis** : edition en statut `closed`.

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/editions")
3. take_snapshot()
4. Trouver uid du bouton "Archiver" sur l'edition cloturee
5. click(uid=archive_edition_button)
6. take_snapshot()
7. ASSERT: modal de confirmation
8. click(uid=confirm_archive_button)
9. take_snapshot()
10. ASSERT: edition archivee, statut = "archived"
```

## A-05 : Consulter les journaux d'audit

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/admin/audit-logs")
3. take_snapshot()
4. ASSERT: piste d'audit affichee
5. ASSERT: colonnes visibles (date, utilisateur, action, details)
```

## A-06 : Filtrer les journaux d'audit

```
1. # Se connecter + naviguer vers les journaux
2. navigate_page(url="http://localhost:5173/admin/audit-logs")
3. take_snapshot()
4. Trouver uid du filtre d'action
5. fill(uid=audit_action_filter, value="create")
6. take_snapshot()
7. ASSERT: seules les actions "create" affichees
8. # Filtrer par utilisateur
9. fill(uid=audit_user_filter, value="admin@alpe-bourse.fr")
10. take_snapshot()
11. ASSERT: resultats filtres par utilisateur
```

## A-07 : Telecharger le rapport de cloture (MCP: partiel)

**Pre-requis** : edition cloturee.

```
1. # Se connecter + naviguer vers l'edition cloturee
2. take_snapshot()
3. Trouver uid du bouton "Rapport de cloture"
4. click(uid=closing_report_button)
5. ASSERT: pas d'erreur affichee
6. # Note: contenu du PDF non verifiable via MCP
```

## A-08 : Consulter la page d'accueil en tant qu'admin (edition active)

**Pre-requis** : edition `in_progress` en BDD.

```
1. # Se connecter en tant qu'admin
2. navigate_page(url="http://localhost:5173/")
3. take_snapshot()
4. ASSERT: page = details de la bourse en cours
5. ASSERT: liens gestionnaire visibles (editions, invitations, etc.)
6. ASSERT: bouton "Cloturer l'edition" visible
```

## A-09 : Consulter la page d'accueil en tant qu'admin (pas d'edition)

**Pre-requis** : aucune edition `in_progress` en BDD.

```
1. # Se connecter en tant qu'admin
2. navigate_page(url="http://localhost:5173/")
3. take_snapshot()
4. ASSERT: message "Aucune bourse n'est en cours"
5. ASSERT: lien "Creer une nouvelle edition" visible
```

---

## A-E01 : Cloturer une edition sans reversements

**Pre-requis** : edition en cours, reversements non calcules.

```
1. # Se connecter + naviguer vers l'edition
2. take_snapshot()
3. click(uid=close_edition_button)
4. take_snapshot()
5. ASSERT: verification de cloture echoue
6. ASSERT: raisons listees (reversements non calcules, paiements non finalises)
```

## A-E02 : Supprimer une edition non brouillon

**Pre-requis** : edition en statut `in_progress`.

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/editions")
3. take_snapshot()
4. Trouver l'edition en cours
5. ASSERT: bouton "Supprimer" masque (uniquement sur brouillons)
```

## A-E03 : Creer une edition avec un nom en doublon

**Donnees** : `tests/data/invalid/editions.json` → `duplicate_edition_name`

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/editions")
3. click(uid=new_edition_button)
4. fill(uid=edition_name_field, value="Bourse Printemps 2026")  # nom deja utilise
5. fill(uid=edition_location_field, value="Autre lieu")
6. fill(uid=start_date_field, value="2026-06-01T09:00")
7. fill(uid=end_date_field, value="2026-06-04T18:00")
8. click(uid=create_edition_button)
9. take_snapshot()
10. ASSERT: erreur "Nom deja utilise"
```

## A-E04 : Archiver une edition non cloturee

**Pre-requis** : edition en statut `in_progress`.

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/editions")
3. take_snapshot()
4. Trouver l'edition en cours
5. ASSERT: bouton "Archiver" masque (uniquement sur editions cloturees)
```

## A-E05 : Cloturer avec des reversements non payes

**Pre-requis** : edition avec reversements calcules mais pas tous payes.

```
1. # Se connecter + naviguer vers l'edition
2. click(uid=close_edition_button)
3. take_snapshot()
4. ASSERT: avertissement dans la verification de cloture
5. ASSERT: mention "Reversements non payes" dans les raisons
```

## A-E06 : Activer une 2e edition alors qu'une est deja active

**Pre-requis** : edition `in_progress` deja existante.

**Donnees** : `tests/data/invalid/editions.json` → `second_active_edition`

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/editions")
3. take_snapshot()
4. # Tenter de passer une 2e edition en statut actif
5. Trouver l'edition configuree
6. click(uid=activate_edition_button)
7. take_snapshot()
8. ASSERT: erreur "Une bourse est deja en cours ([nom]). Cloturez-la avant d'en activer une autre."
```

---

## A-EC01 : Archiver une edition cloturee > 1 an (MCP: partiel)

**Pre-requis** : edition cloturee depuis plus d'un an (fixture `old_closed` dans `editions.json`).

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/editions")
3. take_snapshot()
4. Trouver l'edition cloturee ancienne
5. ASSERT: badge "A archiver" visible (amber)
6. click(uid=archive_edition_button)
7. take_snapshot()
8. ASSERT: modal de confirmation
9. click(uid=confirm_archive_button)
10. ASSERT: edition archivee
```

## A-EC02 : Consulter une edition archivee

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/editions")
3. take_snapshot()
4. # Filtrer par statut "Archive"
5. fill(uid=status_filter, value="archived")
6. take_snapshot()
7. ASSERT: edition archivee visible
8. click(uid=edition_archived_link)
9. take_snapshot()
10. ASSERT: edition en lecture seule (pas de boutons de modification)
```

## A-EC03 : Cloture avec 0 vente

**Pre-requis** : edition en cours sans aucune vente.

```
1. # Se connecter + naviguer vers l'edition
2. click(uid=close_edition_button)
3. take_snapshot()
4. ASSERT: cloture autorisee (0 reversements a calculer)
5. click(uid=confirm_close_button)
6. take_snapshot()
7. ASSERT: edition cloturee avec succes
```
