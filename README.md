# La République des 1 000

**Jouer :** https://pmg57000.github.io/republique-des-1000/ (ou ouvrir `index.html` dans un navigateur).
Tout tient dans ce fichier : il marche hors ligne, sur ordinateur comme sur iPhone.
La partie est sauvegardée dans le navigateur.

## Comment c'est fait
- **Le moteur** (règles, économie, études d'impact, votes, pactes, textes) : la version de Steven,
  `sources/moteur_steven.html`, réutilisée telle quelle.
- **L'interface** (direction artistique, tutoriel d'Hector, animations) : `sources/src/`.
- `python3 sources/build.py` assemble les deux et régénère `index.html` (Python 3, rien à installer).

## Modifier le jeu
- Changer les règles, l'économie ou les textes du moteur : Steven modifie son projet et fournit un nouveau
  `moteur_steven.html` (voir `sources/outils/fusion/LISEZ-MOI.md` pour le rebrancher).
- Changer l'interface : modifier `sources/src/`, puis `python3 sources/build.py`.

| Fichier (`sources/src/`) | Contenu |
|---|---|
| `00_pont.js` | Le lien avec le moteur (noms lisibles des fonctions du jeu) |
| `10_base.js` | Briques communes : boutons, jauges, hémicycle, Hector, fiche d'une loi |
| `15_explications.js` | Fiches des indicateurs, glossaire (MES, agences de notation, droit européen), doctrines des groupes, pactes de coalition |
| `20_accueil.js` | Accueil, choix du scénario et du camp |
| `30_coque.js` | Bandeau, navigation, tableau de bord, bouton « étape suivante » |
| `40_trimestre.js` | Bilan du trimestre, décisions, missions |
| `50_reformes.js` | Catalogue des réformes, comparateur, dossier d'une loi |
| `60_assemblee.js` | Assemblée : séance, négociation, 49.3, dépouillement, registre |
| `70_archives.js` | Archives, écrans Pays et Gouvernement |
| `80_tuto.js` | Le tutoriel d'Hector (tous ses textes en haut du fichier) |
| `85_effets.js` | Confettis, notifications, cinématique de changement de trimestre |
| `90_app.js` | L'application : enchaînement des écrans, sauvegarde |
| `refonte.css`, `refonte_jeu.css` | L'apparence |

Les sauvegardes utilisent les mêmes clés que le jeu de Steven : une partie commencée se reprend dans la version suivante.
