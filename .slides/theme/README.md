# 📐 Thème des slides

Copie de [slidev-theme-eloc](https://github.com/zthxxx/slides/tree/master/packages/slidev-theme-eloc) **1.1.0** (MIT, paquet npm `slidev-theme-eloc`).

| Écart avec l'original | Pourquoi |
| --- | --- |
| `styles/font.css` : `@font-face` locaux au lieu de l'import Google Fonts | Fonctionne hors connexion |
| `fonts/` : Inter 300/700, Merriweather italique 300/700, Fira Code 400/700 (woff2 latin, `@fontsource` 5.3.0, OFL) | Mêmes polices que l'original |
| `styles/surcharges.css` : titres `#` et `##` centrés, en-tête de tableau en gras, `img.schema` inversée en mode sombre, `.credit` (crédit sous une image), espace entre deux blocs de code consécutifs | Eloc centre le bloc du titre mais pas le texte (titre sur 2 lignes aligné à gauche) ; `th` en `font-weight: 400` dans la base Slidev ; `--slidev-code-margin: 0` dans eloc (blocs de code collés) |
| `package.json` : `fonts.provider: none`, `colorSchema: auto`, sans dépendances npm | Aucun téléchargement ; `D` bascule clair/sombre |
