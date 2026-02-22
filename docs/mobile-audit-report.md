# Rapport d'audit mobile - Gestionnaire de Bourse ALPE

**Appareil emule** : Pixel 6 (412x915, DPR 2.6)
**URL de base** : http://localhost:5173
**Role teste** : Administrateur (Sophie Martin)
**Date** : 22 fevrier 2026
**Branche** : `feature/mobile-ui-review`

---

## Resume executif

| Severite | Nombre |
|----------|--------|
| Critique | 3 |
| Important | 4 |
| Mineur | 3 |
| Info | 2 |

**Score qualite mobile global : 65/100**

L'application repose sur TailwindCSS et dispose d'une base responsive correcte : les layouts en colonne unique, les cartes de statistiques et les formulaires s'adaptent bien. Les faiblesses majeures concernent trois axes : les **tableaux de donnees** (non adaptes au mobile, colonnes essentielles invisibles), les **tailles des cibles tactiles** (systematiquement sous les seuils recommandes), et le **menu mobile** (push-down sans overlay).

---

## Audit page par page

### 1. Page d'accueil (`/`)

**Statut : OK (problemes mineurs)**

La page est bien structuree : titre, carte de l'edition en cours avec dates, section "Acces rapide" avec boutons empiles pleine largeur. Aucun overflow horizontal.

| # | Description | Priorite |
|---|-------------|----------|
| 1 | Bouton hamburger : 40x40px, sous le seuil de 48x48dp (Android) | Important |
| 2 | Lien "Bourse ALPE" : 118x28px, zone de tap trop etroite en hauteur | Mineur |
| 3 | Lien "Aide" dans le footer : 28x20px, tres difficile a toucher | Important |
| 4 | Lien "Politique de confidentialite" : 106x40px, sous le seuil en hauteur | Mineur |

---

### 2. Menu hamburger (composant global Header)

**Statut : Problemes**

Le menu s'ouvre et se ferme correctement. Il contient les liens de navigation adaptes au role.

| # | Description | Priorite |
|---|-------------|----------|
| 1 | **Menu push-down sans overlay** : le contenu est pousse vers le bas au lieu d'un affichage en superposition. Pas de backdrop, pas de z-index, contenu cliquable sous le menu. | Important |
| 2 | **Liens du menu : 380x40px** en hauteur, sous le seuil de 48dp. | Important |
| 3 | **Pas de fermeture par tap exterieur** : il faut obligatoirement taper sur le X. | Mineur |

---

### 3. Liste des editions (`/editions`)

**Statut : Problemes**

Cartes de stats en grille 2 colonnes (OK), filtre par statut (OK), bouton "Nouvelle edition" (OK). Le tableau pose probleme.

| # | Description | Priorite |
|---|-------------|----------|
| 1 | **Tableau de 930px dans un viewport de 412px** : seule la colonne "Nom" est visible. Colonnes Dates, Statut, Cree par et Actions cachees sans indicateur de scroll horizontal. | Critique |
| 2 | **Boutons d'action invisibles** (Modifier, Supprimer, Archiver) dans la derniere colonne, hors viewport. | Critique |

---

### 4. Detail d'une edition (`/editions/{id}`)

**Statut : OK (problemes mineurs)**

Page longue (4155px) mais bien structuree. Formulaire en pleine largeur, creneaux de depot en grille 2 colonnes. Section Billetweb lisible.

| # | Description | Priorite |
|---|-------------|----------|
| 1 | **Badge "Inscriptions ouvertes" serre contre le titre**, effet de chevauchement sur 412px. | Important |
| 2 | Bouton "Synchroniser via API" : 153x32px, sous le seuil de 48dp. | Mineur |
| 3 | Stats "Historique des imports" en 4 colonnes : en-tetes wrappent sur plusieurs lignes. | Mineur |

---

### 5. Gestion des invitations (`/admin/invitations`)

**Statut : Problemes**

Stats en cartes (OK), boutons d'action (OK), modale "Nouvelle invitation" (OK, bien adaptee avec overlay).

| # | Description | Priorite |
|---|-------------|----------|
| 1 | **Tableau de 1092px dans un viewport de 412px** : seules les colonnes checkbox et Email visibles. Colonnes Nom, Statut, dates et boutons d'action caches sans indicateur. | Critique |
| 2 | **Impossible de voir le statut des invitations** sans scroll horizontal. | Critique |

---

### 6. Gestion des utilisateurs (`/admin/users`)

**Statut : Problemes**

Champ de recherche et filtre par role (OK).

| # | Description | Priorite |
|---|-------------|----------|
| 1 | **Tableau de 791px dans un viewport de 412px** : colonnes Statut, Resident, Derniere connexion et bouton Modifier caches. | Critique |
| 2 | **Colonne Role tronquee** : "Dep", "Adm", "Ben", "Ges" au lieu des noms complets. Information ambigue. | Critique |
| 3 | **Bouton Modifier inaccessible** dans la derniere colonne, hors viewport. | Critique |

---

### 7. Mes listes (`/lists`)

**Statut : OK**

Etat vide correctement gere : icone centree, titre, message explicatif. Bonne mise en page.

---

### 8. Gestion des etiquettes (`/editions/{id}/labels`)

**Statut : OK (mineur)**

Cartes de stats empilees verticalement (OK), boutons de mode bien dimensionnes (OK), bouton PDF pleine largeur (OK).

| # | Description | Priorite |
|---|-------------|----------|
| 1 | Breadcrumb long qui wrap sur 2 lignes, nuit a la lisibilite. | Mineur |

---

### 9. Tableau de bord admin (`/admin`)

**Statut : OK**

Excellente adaptation mobile. Cartes KPI empilees verticalement, 10 boutons d'actions rapides empiles pleine largeur.

---

### 10. Profil (`/profile`)

**Statut : OK**

Trois sections bien separees (infos, export RGPD, zone de danger). Layout cle/valeur lisible.

---

### 11. Aide (`/aide`)

**Statut : OK**

Contenu textuel lisible, paragraphes bien espaces, listes a puces correctes.

---

### 12. Page de connexion (`/login`)

**Statut : OK (problemes mineurs)**

Formulaire centre, champs lisibles.

| # | Description | Priorite |
|---|-------------|----------|
| 1 | Champs input : 380x42px, sous le seuil de 44px (iOS). | Mineur |
| 2 | Bouton "Se connecter" : 380x40px, sous le seuil de 48dp (Android). | Important |
| 3 | Lien "Mot de passe oublie ?" : 136x20px, zone de tap tres petite. | Important |
| 4 | Lien "Activer mon compte" : 129x19px, zone de tap tres petite. | Important |

---

### 13. Statistiques invitations (`/admin/invitations/stats`)

**Statut : OK**

KPI en grille 2 colonnes, graphique adapte a la largeur, etat vide gere.

---

### 14. Journal d'audit (`/admin/audit-logs`)

**Statut : Problemes**

Filtres bien adaptes en mobile.

| # | Description | Priorite |
|---|-------------|----------|
| 1 | **Tableau de 1078px dans un viewport de 412px** : seules colonnes Date, Action et debut de Utilisateur visibles. Colonnes Role, IP, Detail et Resultat cachees. | Critique |
| 2 | Colonne Utilisateur tronquee : "dep...", "adm..." | Important |

---

## Inventaire complet des problemes

### Critiques (bloquent l'utilisation)

| ID | Page(s) | Description |
|----|---------|-------------|
| C-01 | `/editions`, `/admin/invitations`, `/admin/users`, `/admin/audit-logs` | Tableaux trop larges (791-1092px) dans un viewport de 412px. Colonnes essentielles (Statut, Actions, Role, Dates) cachees par scroll horizontal sans indicateur visuel. |
| C-02 | `/admin/users` | Colonne Role tronquee : "Dep", "Adm", "Ben", "Ges" au lieu des noms complets. |
| C-03 | `/editions`, `/admin/invitations`, `/admin/users` | Boutons d'action dans la derniere colonne, completement hors viewport. |

### Importants (experience degradee)

| ID | Page(s) | Description |
|----|---------|-------------|
| I-01 | Toutes les pages | Cibles tactiles sous les seuils : hamburger 40x40px, liens menu 380x40px, bouton login 380x40px. Seuil Android : 48x48dp, seuil iOS : 44x44px. |
| I-02 | Toutes les pages (header) | Menu mobile push-down sans overlay, sans backdrop, sans fermeture par tap exterieur. |
| I-03 | Toutes les pages (footer) | Liens "Aide" (28x20px) et "Politique de confidentialite" (106x40px) trop petits. |
| I-04 | `/editions/{id}` | Badge statut serre contre le titre, chevauchement sur 412px. |

### Mineurs

| ID | Page(s) | Description |
|----|---------|-------------|
| M-01 | Tableaux | Pas de pagination sur les tableaux longs (14-17+ lignes). |
| M-02 | `/editions/{id}/labels`, `/admin/invitations/stats` | Accents manquants dans certains textes de donnees. |
| M-03 | `/editions/{id}/labels` | Breadcrumb long qui wrap sur 2 lignes. |

---

## Recommandations de correction priorisees

### Priorite 1 - Tableaux de donnees (corrige C-01, C-02, C-03)

**Impact** : 4 pages. **Effort** : moyen.

Creer un affichage en cartes empilees pour les ecrans < 768px. Chaque ligne du tableau devient une carte avec paires label/valeur et boutons d'action visibles en bas.

```
+-----------------------------------+
| sophie.fournier@example.com       |
| Nom : Sophie Fournier             |
| Statut : Expire                   |
| Creee le : 10/02/2026             |
| [Relancer]  [Supprimer]           |
+-----------------------------------+
```

Alternative a minima : ajouter un indicateur visuel de scroll horizontal (ombre degradee a droite).

### Priorite 2 - Menu hamburger (corrige I-02)

**Impact** : toutes les pages. **Effort** : faible a moyen.

Transformer en drawer lateral ou overlay plein ecran avec :
- Backdrop semi-transparent (`bg-black/50`) qui ferme le menu au clic
- Animation de transition (`translateX` ou `opacity`)
- `overflow: hidden` sur le body quand le menu est ouvert
- z-index eleve pour couvrir le contenu

### Priorite 3 - Tailles des cibles tactiles (corrige I-01, I-03)

**Impact** : toutes les pages. **Effort** : faible (CSS).

- Bouton hamburger : `p-2` -> `p-3` (40px -> 48px)
- Liens du menu mobile : ajouter `py-3` (40px -> 48px+)
- Liens du footer : ajouter `py-3`
- Bouton Se connecter : `h-10` -> `h-12` (40px -> 48px)
- Liens textuels (Mot de passe oublie, Activer mon compte) : ajouter `py-2`

### Priorite 4 - Badge statut sur detail edition (corrige I-04)

**Impact** : 1 page. **Effort** : faible.

Sur les ecrans < 640px, empiler titre et badge verticalement : `flex-col sm:flex-row`.

### Priorite 5 - Breadcrumb (corrige M-03)

**Impact** : 1 page. **Effort** : faible.

Tronquer les segments intermediaires en mobile : "Editions / ... / Etiquettes".

---

## Screenshots

Tous les fichiers sont dans `audit-screenshots/pixel6/` (non versionnes).

| Fichier | Page |
|---------|------|
| `login-redirect.png` | Page d'accueil (haut) |
| `home-bottom.png` | Page d'accueil (bas + footer) |
| `home-fullpage.png` | Page d'accueil (pleine page) |
| `menu-hamburger-open.png` | Menu mobile ouvert |
| `editions-list.png` | Liste des editions |
| `edition-detail.png` | Detail edition (titre + badge) |
| `edition-detail-scroll1.png` | Detail edition (configuration) |
| `edition-detail-scroll2.png` | Detail edition (creneaux) |
| `edition-detail-creneaux-header.png` | Detail edition (en-tete creneaux) |
| `edition-detail-bottom.png` | Detail edition (Billetweb) |
| `edition-detail-fullpage.png` | Detail edition (pleine page) |
| `invitations.png` | Invitations (stats + boutons) |
| `invitations-bottom.png` | Invitations (tableau) |
| `invitations-modal-new.png` | Modale nouvelle invitation |
| `invitations-stats.png` | Stats invitations (KPI) |
| `invitations-stats-bottom.png` | Stats invitations (graphique) |
| `users.png` | Utilisateurs (haut) |
| `users-bottom.png` | Utilisateurs (bas) |
| `labels.png` | Etiquettes (haut) |
| `labels-bottom.png` | Etiquettes (bouton PDF) |
| `admin-dashboard.png` | Dashboard (KPI) |
| `admin-dashboard-bottom.png` | Dashboard (actions rapides) |
| `profile.png` | Profil |
| `aide.png` | Aide |
| `audit-logs.png` | Journal d'audit |
| `login.png` | Page de connexion |
