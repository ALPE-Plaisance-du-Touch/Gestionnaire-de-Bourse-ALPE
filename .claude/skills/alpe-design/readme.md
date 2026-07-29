# ALPE — Design System

**ALPE — Association Locale de Parents d'Élèves, Plaisance du Touch.** Association loi 1901 fondée en 1987. Ce dépôt reconstruit *a posteriori* le design system de l'association, à partir du logo officiel et du site en production, pour un usage transversal : site internet, réseaux sociaux, print (affiches, flyers, panneaux d'événement).

---

## 1. Contexte

Douze établissements couverts, de la petite section à la terminale :

| Niveau | Établissements |
| --- | --- |
| Maternelles (5) | Le Blé en Herbe, La Rivière, Marcel Pagnol, Pauline Kergomard, Trois Pommes |
| Élémentaires (4) | Alphonse Daudet, Jacques Prévert, La Rivière, Marcel Pagnol |
| Collèges (2) | Jules Verne, Galilée (La Salvetat) |
| Lycée (1) | Dissart-Françoise (Tournefeuille) |

**Identité revendiquée :** LOCALE · INDÉPENDANTE et AUTONOME · APOLITIQUE. Fil directeur : « le bien-être de l'élève ».

**Chiffres structurants** — ~170 familles adhérentes · cotisation 10 € / famille · CA de 21 personnes, présidé par Charlotte Watier · ~60 bénévoles · pas de subvention municipale (hors prêt de salles et photocopies).

**Deux temps forts qui portent le modèle économique :**
- **Bourse aux vêtements et aux jouets** — 2× / an, espace Monestié, ~10 000 articles, 20 % prélevés sur les ventes, une part reversée aux coopératives scolaires.
- **Forum des métiers et des formations** — 35ᵉ édition les 18–19 février 2026, +90 exposants, ~1 100 collégiens de 8 établissements, précédé d'une « nocturne des métiers » (~60 professionnels, tout public).

**Autres actions :** représentation des parents dans les instances, commission cantine, actions éco-citoyennes.

## 2. Sources utilisées

- `uploads/Logo-ALPE-Complet-CouleursRVB-300dpi.jpg` — logo officiel couleurs RVB 300 dpi (806×554). **Seule source graphique fournie.** Toutes les couleurs de marque sont échantillonnées de ce fichier.
- **Site en production** : https://alpe-plaisance.org/ — WordPress + thème Avada. Pages lues : accueil, `/lassociation/`, `/nos-actions/bourse-aux-vetements/`. Le thème est un template générique du marché : sa mise en page a servi de référence pour l'**architecture d'information et les gabarits de page**, pas pour l'identité visuelle (le site actuel n'exprime que faiblement la marque).
- **Réseaux** : facebook.com/ALPEPlaisanceDuTouch · instagram.com/alpeplaisancedutouch · LinkedIn « forum-des-metiers-alpe ».
- Aucun code source, aucun fichier Figma, aucune charte graphique, aucun binaire de police n'a été fourni.

> ⚠️ **Aucun logo n'a été redessiné.** Les fichiers d'`assets/` sont tous des **dérivés programmatiques** du JPG fourni (détourage du blanc, recadrage, mise à l'échelle). Voir § Iconographie.

---

## 3. Content fundamentals

**Langue.** Français exclusivement. Orthographe soignée, apostrophes typographiques (`'`), accents sur les capitales (« ÉLÈVES », « Événements »).

**Personne.** **« Nous » pour l'association, « vous » pour les familles.** C'est la règle la plus constante de la marque, reprise telle quelle du site : « Nous sommes une association LOCALE », « Nous aurons le plaisir de vous accueillir ». Jamais de « je ». Jamais de nous-collectif abstrait type « l'association informe que » — ALPE parle à la première personne du pluriel, c'est un groupe de parents qui s'adresse à d'autres parents.

**Ton.** Chaleureux, bénévole, factuel. Deux registres cohabitent :
- *Registre convivial* pour les événements — « Une de nos manifestations préférée !!! », « À très vite ! », signatures d'équipe (« L'Équipe Bourse ALPE »). Points d'exclamation autorisés, y compris multiples, dans les annonces d'événement.
- *Registre institutionnel sobre* pour les statuts, l'adhésion, la représentation — phrases longues, pas d'exclamation, vocabulaire précis (« association loi 1901 », « membres du bureau », « instances »).

**Casing.** Phrase case partout (titres compris) : « Bourse aux vêtements », « Les établissements », « Nos actions ». Les **capitales sont un outil d'emphase sémantique**, réservé aux trois valeurs (LOCALE, INDÉPENDANTE, APOLITIQUE) et au bloc signature du logo (« PLAISANCE DU TOUCH »). Jamais de titre en Title Case anglo-saxonne.

**Emphase.** Le **gras** porte l'information actionnable : dates, horaires, montants, chiffres clés — « **Samedi 18 Avril de 9h à 18h** », « **10000 articles sont proposés à la vente** », « cotisation est de **10€ par famille** ». Ne jamais mettre en gras un adjectif.

**Chiffres et dates.** Format français : `18 & 19 février 2026`, `9h à 18h`, `10 €`, `35ᵉ édition`. Les gros volumes s'écrivent en toutes lettres au chiffre près quand ils impressionnent (10 000 articles, 90 exposants, 1 100 collégiens) — c'est la preuve d'échelle de l'association.

**Emoji.** Usage **très parcimonieux et fonctionnel uniquement** : ⚠️ en tête d'une information de dernière minute ou d'une contrainte (« ⚠️ Tous nos créneaux déposants sont maintenant complets »). Pas d'emoji décoratif, pas d'emoji dans les titres, pas de 🎉 / 😊 / 👨‍👩‍👧.

**Longueurs types.** Titre de page : 1–4 mots. Chapeau : 1 phrase. Carte actualité : titre + 2 lignes d'extrait suivies de `[...]`. Bouton : 1–2 mots à l'impératif ou à l'infinitif (« Adhérez », « Contactez-nous », « Déposer », « En savoir plus »).

**À éviter.** Jargon marketing (« solution », « expérience », « écosystème »), superlatifs vides, storytelling. Toute formulation politique ou partisane — l'apolitisme est statutaire et s'entend aussi dans l'écriture.

---

## 4. Visual foundations

### Couleurs
Trois couleurs de marque, échantillonnées dans le logo. Elles suffisent — la palette ne doit pas s'élargir.

| Rôle | Token | Hex | Usage |
| --- | --- | --- | --- |
| Primaire | `--blue-500` | `#00A0D0` | Structure, titres, boutons principaux, liens, aplats de section |
| Secondaire | `--orange-500` | `#F08040` | Appels à l'action, temps forts, accents chauds, survol de lien |
| Accent | `--yellow-500` | `#FFE000` | **Jamais du texte, jamais un fond de bloc.** Uniquement le « swoosh » : soulignement, filet, pastille, trait de séparation |
| Encre | `--blue-800` `#005070` | | Titres longs et texte sur fond clair quand le bleu 500 manque de contraste |

Ratio d'emploi visé : **bleu 70 % / orange 25 % / jaune 5 %**. Deux couleurs de fond maximum par support. Les neutres sont légèrement froids pour cohabiter avec le bleu (`--grey-50` `#F4F7F9` est le gris de fond de référence).

### Typographie
Le logo combine deux caractères : un **rond géométrique à contour** pour « ALPE » et un **humaniste amical** pour la ligne descriptive. Aucun binaire fourni → substitutions Google Fonts, à valider :

- `--font-display` **Baloo 2** — titres d'affiche, hero, chiffres clés. Poids 700/800.
- `--font-heading` **Quicksand** — titres de page et de carte, navigation. Poids 600/700. C'est la police la plus proche de la ligne « PLAISANCE DU TOUCH » (rond géométrique, terminaisons douces) — l'employer en capitales + `--tracking-caps` pour retrouver ce traitement.
- `--font-body` **Nunito** — courant du texte, formulaires, UI. Poids 400/600/700.

Échelle : voir `tokens/typography.css`. Corps de texte long à `--text-md` (17px) / `--leading-relaxed` (1.65) — public parent, lisibilité avant densité. `text-wrap: pretty` sur les titres.

### Formes, rayons, cartes
Le logo n'a aucun angle vif : **les rayons sont généreux**. Cartes `--radius-lg` (18px), aplats de section `--radius-2xl` (32px), contrôles en pilule (`--radius-pill`). Aucun carré à angle droit sauf image plein cadre.

**Carte** = fond blanc + `--shadow-sm` + bordure `1px --border-subtle`. Au survol : `--shadow-lg` et translation `-2px` sur Y. Pas de bordure colorée sur un seul côté (motif à proscrire). Une carte « temps fort » se distingue par un **filet supérieur de 4px** en bleu ou orange, jamais par un fond saturé.

### Ombres, transparence, flou
Ombres douces et **teintées de bleu profond** (`rgba(3,59,83,·)`), jamais de noir pur. Pas d'ombre au-delà de `--shadow-lg` en interface ; `--shadow-xl` réservé aux modales. Transparence : uniquement pour les **dégradés de protection** sous un texte posé sur photo (`linear-gradient(transparent → rgba(3,59,83,.72))`), et pour les états survolés d'aplats (`rgba` de la couleur à 8–12 %). **Aucun flou d'arrière-plan (`backdrop-filter`)** — hors vocabulaire de la marque. Préférer une **capsule opaque** (fond blanc, rayon pill) à un dégradé de protection quand le texte est court.

### Fonds et motifs
1. Blanc, par défaut.
2. `--grey-50`, pour alterner les sections.
3. Aplat bleu `--blue-500` ou bleu profond `--blue-800`, pour une section d'appel à l'action ou un bandeau print.
4. **Le swoosh jaune** : une courbe unique, ample, passant derrière un titre ou un bloc — c'est le seul ornement graphique de la marque, directement issu du logo. À utiliser une fois par support, pas plus.

Pas de dégradé multicolore, pas de dégradé violet-bleu, pas de texture, pas de grain, pas de motif répété. L'imagerie est **photographique et documentaire** : photos réelles d'événements (bourse, forum, stands), lumière naturelle, tonalité chaude, cadrage large sur les groupes. Pas d'illustration vectorielle, pas de banque d'images corporate. Aucune illustration de marque n'existe hors du logo.

### Mouvement
Discret et utile. Entrées en fondu + translation 8px vers le haut, `--duration-base` (220 ms), `--ease-out`. Survols en `--duration-fast` (150 ms). `--ease-soft-back` réservé à une confirmation (badge d'inscription validée). Pas de parallaxe, pas d'apparition au défilement en cascade sur toute une page, pas de rebond décoratif. Respecter `prefers-reduced-motion`.

### États
- **Survol** — boutons pleins : couleur d'un cran plus foncée (`-600`) ; boutons fantômes : fond `--surface-brand-soft` ; cartes : ombre + `translateY(-2px)` ; liens : passage au **orange** avec soulignement 1px.
- **Pression** — `scale(var(--press-scale))` = 0.98 + couleur `-700`. Pas de déplacement vers le bas.
- **Focus** — jamais supprimé : `--shadow-focus` (anneau bleu 3px, 35 % d'opacité). Anneau orange sur les surfaces bleues.
- **Désactivé** — opacité 0.45, `cursor: not-allowed`, aucune ombre.
- **Sélectionné / actif** — pastille pleine dans la couleur de marque, texte blanc.

### Layout
Conteneur `1200px`, colonne de lecture `760px`, gouttière 24px, rythme vertical de section `80px` (`48px` en tight). Grille 12 colonnes sur desktop, 1 colonne sous 768px. Header **collant** (sticky) opaque blanc avec `--shadow-sm` une fois défilé — pas de header transparent. Tout est aligné sur une grille de 4px : si une valeur ne tombe pas sur la grille, c'est une erreur, pas une intention.

### Print & réseaux sociaux
Affiche A3/A4 : bandeau bleu en tête avec le logo détouré, titre en Baloo 2 (`--text-6xl`), date en orange, swoosh jaune, bloc pratique en bas (lieu, horaires, tarif). Réseaux sociaux : format carré 1080×1080 et story 1080×1920, logo toujours en haut à gauche ou centré haut, marge de sécurité = hauteur du logo. Minimum 12 pt en print, 24 px en slide.

---

## 5. Iconographie

- **Le logo est le seul actif graphique de la marque.** Il combine un pictogramme (deux visages souriants, fille orange / garçon bleu, dessinés au trait rond) + le mot « ALPE » composé en Grandstander SemiBold + la ligne descriptive. Ne jamais séparer le lettrage de la ligne descriptive dans un usage officiel ; le pictogramme seul (`logo-v2-mark.svg`) est admis en avatar de réseau social ou favicon, et `logo-v2-square.svg` comme tuile carrée.
- **Aucune icône propre n'existe.** Le site en production s'appuie sur **Font Awesome** (livré par le thème Avada) pour ses icônes sociales et utilitaires. Le design system conserve ce choix : **Font Awesome 6 Free**, chargé depuis CDN, style `solid` pour les actions et `brands` pour les réseaux. Aucun fichier d'icône n'a pu être copié du site (les binaires ne sont pas accessibles depuis ce projet) — **substitution CDN à valider**.
- Épaisseur et taille : icône 20px dans un contrôle 42px, 24px dans un bandeau. Couleur = couleur du texte adjacent, jamais une troisième couleur.
- **Ne jamais dessiner une icône ni un pictogramme à la main** pour ALPE. Si un symbole manque, prendre Font Awesome ; s'il n'existe pas, écrire le mot.
- **Emoji** : voir Content fundamentals — seul ⚠️ est admis, en contexte d'alerte.
- **Caractères unicode** comme icônes : `→` autorisé dans les liens « En savoir plus → ». Rien d'autre.

### `assets/`
| Fichier | Description |
| --- | --- |
**Logo 2026 — en vigueur** (validé le 25/07/2026)

| Fichier | Description |
| --- | --- |
| `logo-v2-mark.svg` | Pictogramme seul, couleurs — avatar, favicon, tampon |
| `logo-v2-mark-mono.svg` | Pictogramme monochrome `#1b2a33` |
| `logo-v2-mark-reversed.svg` | Pictogramme blanc + courbe jaune, fond foncé |
| `logo-v2-square.svg` | Tuile carrée 512×512 sur fond blanc — favicon, avatar |
| `logo-v2-stacked.svg` | Verticale complète — **usage par défaut** |
| `logo-v2-horizontal.svg` | Horizontale complète — en-tête de site, papeterie |
| `logo-v2-mono.svg` / `logo-v2-reversed.svg` | Monochrome / réserve, version complète |
| `logo-v2-court-carre.svg` · `logo-v2-court-rect.svg` | Verrouillage court (visages + sigle), carré et rectangulaire |
| `logo-v2-complet-carre.svg` · `logo-v2-complet-rect.svg` | Verrouillage complet (avec baseline), carré et rectangulaire |
| `logo-alpe-v2-complet.png` | **PNG 2× transparent** — export de référence hors navigateur |
| `logo-alpe-v2-horizontal.png` | PNG 2× transparent, horizontal complet — utilisé par l'UI kit et les gabarits |
| `logo-alpe-v2-court.png` · `logo-alpe-v2-horizontal-court.png` | PNG 2× transparent, sans baseline |
| `logo-alpe-v2-mono.png` · `logo-alpe-v2-reversed.png` | PNG 2× transparent, monochrome et réserve |

⚠️ Les SVG appellent **Grandstander** et **Quicksand** depuis Google Fonts : hors navigateur (impression, bureautique, `<img>` isolé) le lettrage retombe sur une police système. Pour ces usages, prendre les **PNG**. La vectorisation du lettrage reste à faire dès que le binaire de la police est disponible.

**Archive — logo 1987** (plus référencé nulle part, conservé pour mémoire)

| Fichier | Description |
| --- | --- |
| `logo-alpe-full.png` | Logo complet, fond blanc (683×432) |
| `logo-alpe-full-transparent.png` | Logo complet, fond transparent |
| `logo-alpe-mark.png` | Pictogramme seul |
| `logo-alpe-square-512.png` | Tuile carrée 512×512 |
| `uploads/Logo-…-300dpi.jpg` | Fichier source d'origine |

### Logo 2026 — en vigueur
Le logo de 1987 est remplacé par la refonte validée le 25 juillet 2026. Tous les principes d'origine sont conservés — deux visages d'enfants souriants (fille orange, garçon bleu), la courbe jaune, la ligne descriptive + « PLAISANCE DU TOUCH » — l'exécution est modernisée :

| Principe conservé | Modernisation |
| --- | --- |
| Deux visages souriants | Tracé d'**épaisseur constante** (8 unités, terminaisons rondes), cercles parfaits, **inclinés de 14° vers l'extérieur** |
| Fille orange / garçon bleu | Différenciation réduite à l'essentiel : mèche latérale à gauche, houppe à droite |
| Lettrage « ALPE » | Composé en **Grandstander SemiBold 600**, le **L** en orange pour *Locale* |
| Ombre portée, contour double | **Supprimés** — à plat, une seule couleur pleine par lettre |
| Courbe jaune | Devient la **ligne de sol du pictogramme** : le picto est autonome sans perdre le swoosh |
| Une seule version | 5 verrouillages (vertical, horizontal, picto, monochrome, réserve) + formats court / complet en carré et rectangulaire |

**Manquant** — à fournir par l'association : logo vectoriel (SVG/EPS/AI), variante monochrome et fond foncé, photothèque des événements (bourse, forum), binaires de police officiels.

---

## 6. Index du dépôt

- `versions.md` — version en vigueur, dettes connues, procédure de validation et d'évolution.
- `styles.css` — point d'entrée unique (liste d'`@import`).
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `radii.css`, `shadows.css`, `motion.css`, `semantic.css`, `base.css`.
- `assets/` — logos (voir tableau ci-dessus).
- `guidelines/` — cartes spécimen des fondations (couleurs, type, espacement, marque).
- `components/` — primitives React :
  - `actions/` — `Button`, `IconButton`
  - `forms/` — `Input`, `Select`, `Checkbox`, `Radio`, `Switch`
  - `display/` — `Card`, `Badge`, `Tag`, `StatTile`, `SectionTitle`, `EventCard`, `SchoolChip`, `Swoosh`
  - `navigation/` — `Tabs`, `Breadcrumb`
  - `feedback/` — `Dialog`, `Toast`, `Tooltip`, `Callout`
- `ui_kits/website/` — recréation du site alpe-plaisance.org (accueil, association, bourse, adhésion).
- `templates/affiche-evenement/` — affiche A4 print (bourse, forum, réunion), champs éditables.
- `templates/post-reseaux/` — post carré 1080×1080 et story 1080×1920.
- `SKILL.md` — enveloppe Agent Skill (téléchargeable pour Claude Code).

### Additions volontaires
Aucune source ne définissait d'inventaire de composants (site sous thème générique, pas de Figma, pas de code). Le jeu de primitives est donc un **jeu standard** dimensionné aux besoins réels de l'association, plus quatre pièces spécifiques à ALPE : `EventCard` (bourse / forum), `StatTile` (chiffres clés), `SchoolChip` (les 12 établissements), `Swoosh` (le trait jaune du logo).
