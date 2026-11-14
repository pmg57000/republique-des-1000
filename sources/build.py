#!/usr/bin/env python3
"""Reconstruit index.html (le jeu) à partir du moteur de Steven (moteur_steven.html, jamais modifié)
et de l'interface de la refonte (dossier src/). Usage : python3 build.py  (Python 3, aucune dépendance)."""
import base64, glob, os, re, sys

ICI = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ICI, "src")
ORIGINAL = os.path.join(ICI, "moteur_steven.html")
SORTIE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ICI, "..", "index.html")
POLICES = os.path.join(ICI, "polices")

lignes = open(ORIGINAL, encoding="utf-8").read().split("\n")

# 1. Tête : métadonnées d'origine (sans polices distantes ni ancien thème), icône neuve
def b64(p):
    return base64.b64encode(open(p, "rb").read()).decode()

icone = "data:image/png;base64," + b64(os.path.join(ICI, "assets", "icone.png"))
tete = []
for l in lignes[:15]:
    if 'name="color-scheme"' in l:
        l = '  <meta name="color-scheme" content="light">'
    elif 'name="theme-color"' in l:
        l = '  <meta name="theme-color" content="#ffffff">'
    elif 'apple-mobile-web-app-status-bar-style' in l:
        l = '  <meta name="apple-mobile-web-app-status-bar-style" content="default">'
    elif 'rel="apple-touch-icon"' in l:
        l = f'  <link rel="apple-touch-icon" href="{icone}">'
    elif 'rel="icon"' in l:
        l = f'  <link rel="icon" type="image/png" href="{icone}">'
    tete.append(l)

# 2. CSS utilitaire d'origine (Tailwind compilé), conservé pour les écrans réutilisés
assert lignes[18].startswith("<style>/*! tailwindcss"), lignes[18][:60]
tailwind = lignes[18] + "\n" + lignes[19]

# 3. Polices embarquées (fonctionne hors ligne)
def police(fam, fichier, poids, style="normal"):
    return (f'@font-face{{font-family:"{fam}";font-style:{style};font-weight:{poids};font-display:swap;'
            f'src:url(data:font/woff2;base64,{b64(fichier)}) format("woff2");}}')

polices = "\n".join([
    police("Lilita One", os.path.join(POLICES, "lilita-one-latin-400-normal.woff2"), 400),
    police("Nunito", os.path.join(POLICES, "nunito-latin-wght-normal.woff2"), "200 1000"),
    police("Source Serif 4", os.path.join(POLICES, "source-serif-4-latin-wght-normal.woff2"), "200 900"),
    police("Source Serif 4", os.path.join(POLICES, "source-serif-4-latin-wght-italic.woff2"), "200 900", "italic"),
])
css = open(os.path.join(SRC, "refonte.css"), encoding="utf-8").read() + "\n" + open(os.path.join(SRC, "refonte_jeu.css"), encoding="utf-8").read()

# 4. Script : bundle d'origine (moteur + écrans réutilisables) + nouvelle interface montée à la place de l'ancienne
debut = next(i for i, l in enumerate(lignes) if l.strip().startswith("<script>"))
fin = max(i for i, l in enumerate(lignes) if l.strip() == "</script>")
script = "\n".join(lignes[debut:fin + 1])
# Appel de rendu de l'interface de Steven, remplacé par la nôtre (à mettre à jour si le moteur est reconstruit)
ancien_rendu = '(0,_5.createRoot)(document.getElementById("racine")).render((0,wm.jsx)(O5.StrictMode,{children:(0,wm.jsx)(Zm,{})}));'
assert script.count(ancien_rendu) == 1
modules = [open(p, encoding="utf-8").read() for p in sorted(glob.glob(os.path.join(SRC, "*.js")))]
script = script.replace(ancien_rendu, "\n" + "\n".join(modules) + "\n")

html = "\n".join(tete) + "\n" + tailwind + "\n<style>\n" + polices + "\n" + css + "\n</style>\n</head>\n<body>\n  <div id=\"racine\"></div>\n  " + script + "\n</body>\n</html>\n"
open(SORTIE, "w", encoding="utf-8").write(html)
print(SORTIE, f"{len(html.encode('utf-8'))/1024:.0f} Ko")
