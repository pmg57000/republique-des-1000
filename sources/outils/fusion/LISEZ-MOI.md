# Intégrer une nouvelle version du moteur de Steven

L'interface (`src/`) parle au moteur par `src/00_pont.js`, qui donne des noms lisibles aux fonctions
du fichier de Steven. Ces fonctions ont des noms raccourcis (`Yx`, `gt`, `Ho`…) qui **changent à chaque
fois que Steven reconstruit son jeu**. Quand il envoie une nouvelle version :

1. Extraire le `<script>` de l'ancien et du nouveau fichier (`bundle.js`).
2. `npm i acorn` puis `node decls.cjs ancien_bundle.js old.json` et `node decls.cjs nouveau_bundle.js new.json`.
3. `python3 match.py` : apparie les déclarations des deux versions et produit `map.json` (ancien nom → nouveau nom).
4. Réécrire `00_pont.js` avec ce tableau, puis vérifier les noms douteux à la main.
5. Mettre à jour `ancien_rendu` dans `build.py` (la dernière ligne du script de Steven).
6. `diffdecl.py` + `rename.cjs` affichent ce qui a changé dans chaque fonction (textes, règles, écrans).

**Plus simple à long terme :** si Steven ajoute dans son code source une ligne du type
`window.MOTEUR = { nouvellePartie, info, deposer, voter, … }`, les noms ne changeront plus jamais
et cette étape disparaît.
