# Versions du design system ALPE

## v1.0 — Base VALIDÉE par ALPE le 25 juillet 2026

> Base de référence intangible. Toute évolution passe désormais par une nouvelle entrée de version ci-dessous.

Périmètre figé : tokens (couleurs échantillonnées du logo, type, espacement, rayons, ombres, mouvement), 20 cartes de fondations, 21 composants, UI kit site web (4 écrans), 2 gabarits print / réseaux sociaux, `SKILL.md`.

**Dettes connues, reportées à v1.1** (aucune n'invalide la base) :
- Polices substituées (Baloo 2 / Quicksand / Nunito) — en attente des binaires d'origine.
- Logo dérivé du JPG 300 dpi — en attente du vectoriel, du monochrome et de la variante fond foncé.
- Aucune photothèque — zones image volontairement vides.
- Icônes Font Awesome 6 en CDN, hérité du thème Avada du site.

### Ce que « valider » veut dire, concrètement
1. **Relire l'onglet Design System** carte par carte (Colors, Type, Spacing, Brand, Components) et me signaler tout écart avec ce que vous reconnaissez de la marque.
2. **Ouvrir `ui_kits/website/index.html`** et cliquer les 4 écrans : c'est le test le plus parlant, les fondations y sont assemblées.
3. **Ouvrir les 2 gabarits** (`templates/`) et vérifier qu'une affiche et un post réels tiennent dedans sans rien casser.
4. Dire « v1.0 validée » — je note la date ici et la base devient intangible : les évolutions passent alors par une nouvelle entrée de version.

## v1.1 — Logo 2026 VALIDÉ le 25 juillet 2026

Refonte du logo, validée après quatre tours d'exploration (formes de visages → typographies → graisses → verrouillages).

**Ce qui est retenu**
- **Pictogramme** : deux têtes d'enfants au trait rond d'épaisseur constante, inclinées de 14° vers l'extérieur (variante F2). Fille orange `#f08040` à gauche, garçon bleu `#00a0d0` à droite, courbe jaune `#ffe000` en ligne de sol. À plat, sans ombre portée.
- **Lettrage** : Grandstander SemiBold 600 (variante V2), le **L** en orange pour *Locale*.
- **Baseline** : Quicksand — « Association *Locale* de Parents d'Élèves » + « PLAISANCE DU TOUCH » en capitales espacées.
- **Verrouillages** : vertical (principal), horizontal, pictogramme seul, monochrome `#1b2a33`, réserve sur fond sombre — plus les formats **court** (visages + sigle) et **complet** (avec baseline), chacun en carré et en rectangulaire.

**Conséquences sur la base**
- `tokens/fonts.css` : ajout de Grandstander et du token `--font-logo`.
- Logo remplacé partout : UI kit site (en-tête, pied de page, favicon, illustration d'accueil), affiche A4, posts réseaux, vignette du système, cartes Brand « Logo complet » et « Pictogramme ».
- Ajout de `assets/logo-v2-square.svg` — tuile carrée 512×512 sur fond blanc (favicon, avatar).
- Les quatre PNG du logo 1987 (`logo-alpe-full*.png`, `logo-alpe-mark.png`, `logo-alpe-square-512.png`) sont conservés en archive dans `assets/`, plus référencés nulle part.

**Dette restante** : le lettrage des SVG s'appuie sur Grandstander chargée depuis le CDN Google. En `<img>` ou en impression, cette police n'est pas résolue — utiliser les **PNG** `logo-alpe-v2-*.png` (fond transparent, 2×) pour tout usage hors navigateur, en attendant une vectorisation du lettrage à partir du binaire de la police.

## Comment travailler les évolutions

**Trois natures de demande, trois traitements :**

| Nature | Exemple | Traitement |
| --- | --- | --- |
| **Correction** | un hex faux, un rayon trop grand, une faute de copie | patch direct dans la base, noté en `v1.0.x` |
| **Ajout** | un composant qui manque (Accordion, Timeline), un gabarit (flyer A5, bannière Facebook), un écran | ajouté à la base sans toucher à l'existant, noté en `v1.1` |
| **Changement de direction** | « le bleu doit être plus profond », « les cartes doivent être plus denses » | exploré **à côté** de la base (variantes comparables), puis fusionné une fois tranché |

**Règle de sécurité :** je ne modifie jamais un token de la base pour un besoin ponctuel. Si un support demande une couleur ou une taille absente, c'est soit un alias sémantique en plus, soit le signe que la base doit évoluer — et on en parle.

**La bonne façon de me lancer une évolution :** nommez le support ou l'écran concerné, ce qui ne va pas, et le résultat attendu. Exemple utile : « sur l'affiche, la date se perd — il faut qu'elle se lise à 3 mètres ». Exemple à éviter : « rends l'affiche plus dynamique ».

## v1.1 — En cours

### Proposition de logo 2026 — **en attente de décision**
5 déclinaisons SVG dans `assets/` (`logo-alpe-2026-*.svg`), visibles sur la carte « Logo — proposition 2026 » de l'onglet Design System, en comparaison directe avec le logo actuel. Principes d'origine conservés, exécution modernisée (voir readme.md → « Proposition de logo 2026 »).

**Correction appliquée :** le **L** est orange (L pour LOCALE), pas le P — corrigé sur la base et les trois alternatives, y compris le mot « Locale » de la ligne descriptive.

**Trois alternatives soumises** (carte « Logo — 3 alternatives ») :
- **A — Trait continu** : la courbe jaune repasse **sous le lettrage** comme en 1987 ; trait plus épais, cheveux plus présents. La plus fidèle à l'original.
- **B — Duo plein** : visages en **aplat** avec détails en réserve blanche ; lettrage en Quicksand. La plus lisible en très petit et en une seule couleur (tampon, broderie, sérigraphie).
- **C — Signature** : réduction extrême — deux cercles, deux sourires, ni yeux ni cheveux ; la courbe traverse tout le verrouillage. La plus adulte et la plus solide à 34 px.

Trois issues possibles :
1. **Vous validez** → la proposition devient la marque officielle, je remplace les PNG dérivés partout (site, gabarits, cartes, thumbnail) et j'écris les règles d'usage (taille minimale, zone de protection, interdits).
2. **Vous validez avec réserves** → dites-moi quoi corriger (épaisseur du trait, taille relative picto/lettrage, position de la courbe, dessin des cheveux…).
3. **Vous gardez le logo de 1987** → je supprime les fichiers et la carte, et on reste sur la vectorisation à l'identique par un graphiste.

## Journal

- **25 juillet 2026 — proposition de logo 2026** — 5 déclinaisons SVG soumises à décision.
- **25 juillet 2026 — v1.0 validée** — Construction initiale à partir du logo officiel et du site alpe-plaisance.org. Deux correctifs avant validation : alignement des chiffres du bandeau `StatTile` (`align-items: start`) et non-césure des grands nombres (`white-space: nowrap`).
