# Template — commentaire enrichissant (Mode REFINE)

Format à utiliser **systématiquement** pour les commentaires de version rédigée. Le commentaire **complète** le body (souvent laconique) — il ne le remplace pas.

```markdown
## Version rédigée de l'issue

### Contexte

<1-3 paragraphes : situation actuelle, écart, ce que l'utilisateur veut.
Citer fichiers et lignes réels du repo.>

État actuel — [<fichier>](frontend/src/components/<X>.tsx) :
- L. NN : <ce qui est là>

### Périmètre

- <Ce qui est in, décisions de l'interview comme bullets actionnables>
- <Inclure les choix par défaut recommandés et validés par l'utilisateur>

### Tâches

- [ ] <Action concrète 1, formulation impérative>
- [ ] <Action concrète 2>
- [ ] <Test / validation>

### Critères d'acceptation

- [ ] <Comportement observable du POV utilisateur>
- [ ] <Pas de régression sur X>

### Hors scope

- <Ce qui ressemble mais relève d'une autre issue>

### Liens

- Backend : [<endpoint>](backend/app/api/v1/endpoints/<X>.py)
- Frontend : [<page>](frontend/src/pages/<X>.tsx)
- Doc : [<section>](docs/<X>.md)
- Issue origine : #NN · Couplée à : #NN
```

## Commentaire de mise à jour ponctuelle

Pour un commentaire qui ne rejoue pas le body en entier (partage d'un résultat d'investigation, changement d'état) :

```markdown
**[YYYY-MM-DD] <résumé en une ligne>**

<Contenu : nouvelle info, résultat, décision prise, état actualisé.
Citer les fichiers / mesures concrets.>

Sources :
- <URL ou chemin>
```

## Règles communes

- **Jamais** appeler `gh issue edit --body …` — le body original est intouchable en mode REFINE
- Le commentaire complète, ne répète pas ce qui est déjà dans le body ou les commentaires précédents
- Citer la date au format ISO `[YYYY-MM-DD]` quand le commentaire actualise un état
- Pas de signature « Generated with Claude Code » ou équivalent
- Pas de credentials, tokens, mots de passe, secrets
- MAJ titre / labels via `gh issue edit` (sans `--body`) dans un call séparé — voir SKILL.md Step 5
