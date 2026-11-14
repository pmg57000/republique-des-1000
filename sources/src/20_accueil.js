/* ---------- Illustrations vectorielles ---------- */
function Palais({ className }) {
  /* Façade de palais républicain stylisée : fronton, colonnade, perron, drapeau */
  const colonnes = Array.from({ length: 12 }, (_, i) => 62 + i * 25);
  return h("svg", { viewBox: "0 0 420 230", className: cx("rp-palais", className), "aria-hidden": true },
    h("g", { className: "rp-palais__drapeau" },
      h("line", { x1: 210, y1: 6, x2: 210, y2: 62 }),
      h("rect", { x: 211, y: 8, width: 11, height: 18, fill: "var(--bleu)" }),
      h("rect", { x: 222, y: 8, width: 11, height: 18, fill: "#fff", stroke: "var(--trait-fort)", strokeWidth: 0.6 }),
      h("rect", { x: 233, y: 8, width: 11, height: 18, fill: "var(--rouge)" })),
    h("path", { className: "rp-palais__fronton", d: "M44 104 L210 58 L376 104 Z" }),
    h("path", { className: "rp-palais__trait", d: "M70 98 L210 66 L350 98" }),
    h("rect", { className: "rp-palais__plein", x: 40, y: 104, width: 340, height: 12 }),
    colonnes.map((x) => h("g", { key: x },
      h("rect", { className: "rp-palais__col", x: x - 6, y: 118, width: 12, height: 74 }),
      h("rect", { className: "rp-palais__plein", x: x - 8, y: 116, width: 16, height: 4 }),
      h("rect", { className: "rp-palais__plein", x: x - 8, y: 190, width: 16, height: 4 }))),
    h("rect", { className: "rp-palais__plein", x: 36, y: 194, width: 348, height: 8 }),
    h("rect", { className: "rp-palais__marche", x: 24, y: 204, width: 372, height: 8 }),
    h("rect", { className: "rp-palais__marche", x: 10, y: 214, width: 400, height: 8 }));
}

function Boucle({ actif }) {
  const etapes = [
    ["1", "Bilan", "Lire ce qui a changé, trancher les décisions urgentes."],
    ["2", "Session", "Comparer les projets, commander les études, déposer au vote."],
    ["3", "Séance", "Négocier, amender, voter. Puis clore le trimestre."],
  ];
  return h("ol", { className: "rp-boucle" }, etapes.map(([n, t, d], i) =>
    h("li", { key: n, className: cx("rp-boucle__etape", actif === i && "rp-boucle__etape--actif") },
      h("span", { className: "rp-boucle__num" }, n),
      h("strong", null, t), h("span", null, d))));
}

function Accueil({ sauvegarde, terminee, onReprendre, onLancer, onPremium, tutoFini }) {
  const [etape, setEtape] = useState(0);
  const [scenario, setScenario] = useState("mandat-2027");
  const [camp, setCamp] = useState("CP");
  const [tutoriel, setTutoriel] = useState(!tutoFini);
  useEffect(() => { document.getElementById("cadre")?.scrollTo({ top: 0, behavior: "instant" }); }, [etape]);
  const compo = useMemo(() => Object.fromEntries(M.partis.map((p) => [p.id, p.sieges])), []);
  if (etape === 0) {
    return h("div", { className: "rp-accueil" },
      h("div", { className: "rp-tricolore", "aria-hidden": true }),
      h("header", { className: "rp-accueil__bandeau" },
        h(Marque, null), h("span", { className: "rp-accueil__mention" }, "Simulation politique · 2027–2032")),
      h("main", { className: "rp-accueil__une" },
        h("div", { className: "rp-accueil__texte" },
          h(Surtitre, null, "France · 1 000 citoyens · 100 députés"),
          h("h1", { className: "rp-accueil__titre" }, "La République",
            h("span", { className: "rp-accueil__titre-1000" }, "des ", ["1", "\u00a0", "0", "0", "0"].map((c, i) => h("b", { key: i, style: { "--i": i } }, c)))),
          h("p", { className: "rp-accueil__chapo" }, "Mai 2027 : vous entrez à l'Élysée. Une Assemblée sans majorité, un pays endetté. Vingt trimestres pour gouverner, et convaincre la moitié des citoyens de vous réélire."),
          sauvegarde
            ? h("div", { className: "rp-reprise" },
                h("div", { className: "rp-reprise__tete" },
                  h(Tampon, { ton: "bleu", petit: true }, "Mandat en cours"),
                  h("span", null, sauvegarde.scenario)),
                h("p", { className: "rp-reprise__titre" }, `${sauvegarde.libelle} · mandat ${sauvegarde.mandat}`),
                h("dl", { className: "rp-reprise__chiffres" },
                  h("div", null, h("dt", null, "Trimestre"), h("dd", null, `${sauvegarde.tourMandat}/${sauvegarde.toursParMandat}`)),
                  h("div", null, h("dt", null, "Popularité"), h("dd", null, M.pct(sauvegarde.popularite, 0))),
                  h("div", null, h("dt", null, "Ministres"), h("dd", null, `${sauvegarde.ministres ?? 0}/3`)),
                  h("div", null, h("dt", null, "Lois"), h("dd", null, sauvegarde.lois))),
                sauvegarde.pm && h("p", { className: "rp-reprise__note" }, `Premier ministre : ${sauvegarde.pm}`),
                sauvegarde.le && h("p", { className: "rp-reprise__note" }, `Dernière séance : ${new Date(sauvegarde.le).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}`),
                h("div", { className: "rp-reprise__actions" },
                  h(Bouton, { onClick: onReprendre, taille: "grand" }, "Reprendre le mandat"),
                  h(Bouton, { variante: "ligne", onClick: () => setEtape(1) }, "Nouvelle partie")))
            : terminee
              ? h("div", { className: "rp-reprise" },
                  h("div", { className: "rp-reprise__tete" }, h(Tampon, { ton: terminee.fin.cause === "victoire" ? "vert" : "rouge", petit: true }, "Mandat terminé"), h("span", null, terminee.fin.libelle)),
                  h("p", { className: "rp-reprise__titre" }, terminee.fin.titre),
                  h("p", { className: "rp-reprise__note" }, terminee.fin.texte),
                  h("div", { className: "rp-reprise__actions" },
                    h(Bouton, { onClick: onReprendre }, "Revoir le bilan du mandat"),
                    h(Bouton, { variante: "ligne", onClick: () => setEtape(1) }, "Nouvelle partie")))
              : h("div", { className: "rp-accueil__actions" },
                  h(Bouton, { taille: "grand", onClick: () => setEtape(1) }, "Commencer un mandat")),
          h(CarteTutoriel, { remplace: !!(sauvegarde || terminee), onLancer: () => onLancer({ scenarioId: "mandat-2027", camp: "CP", tutoriel: true }) })),
        h("div", { className: "rp-accueil__scene", "aria-hidden": true },
          h("div", { className: "rp-accueil__formes" }, Array.from({ length: 9 }, (_, i) => h("i", { key: i, style: { "--i": i, left: `${(i * 11 + 4) % 94}%`, top: `${(i * 37 + 8) % 86}%` } }))),
          h(Hemicycle, { segments: segmentsComposition(compo), taille: 460, anime: true }),
          h(Palais, null),
          h("div", { className: "rp-accueil__hector" },
            h("div", { className: "rp-accueil__bulle" }, sauvegarde ? "Le pays vous attend, on reprend ?" : "Prêt à gouverner ? Je vous guide !"),
            h(Hector, { humeur: "content", taille: 104 })))),
      h("section", { className: "rp-accueil__boucle", "aria-label": "Un trimestre en trois temps" },
        h(Surtitre, null, "Chaque trimestre, en trois temps"),
        h(Boucle, null)),
      h("footer", { className: "rp-accueil__reperes" },
        [["1 000", "citoyens à satisfaire"], ["100", "sièges, aucune majorité"], ["20", "trimestres avant l'élection"], [String(M.catalogue.length), "réformes sur la table"]]
          .map(([v, l]) => h("div", { key: l }, h("strong", null, v), h("span", null, l)))),
      h("p", { className: "rp-accueil__neutralite" }, "Ceci est un jeu de simulation politique et économique. Le pays est ramené à 1 000 habitants en respectant la démographie, les métiers et les vrais ordres de grandeur français. Aucun parti pris idéologique n'est défendu : chaque choix produit des effets mécaniques, à des fins purement ludiques."));
  }
  const sieges = compo;
  const allies = M.partis.filter((p) => p.id !== camp && M.allie(camp, p.id)).map((p) => p.id);
  const segs = ORDRE_PARTIS.map((id) => ({ parti: id, n: sieges[id], etat: id === camp ? "plein" : allies.includes(id) ? "allie" : "gris" }));
  return h("div", { className: "rp-accueil rp-accueil--formulaire" },
    h("div", { className: "rp-tricolore", "aria-hidden": true }),
    h("header", { className: "rp-accueil__bandeau" },
      h("button", { type: "button", className: "rp-retour", onClick: () => setEtape(etape - 1) }, "← Retour"),
      h(Surtitre, null, `Nouvelle partie · étape ${etape} sur 2`)),
    etape === 1
      ? h("main", { className: "rp-formulaire" },
          h("h1", { className: "rp-formulaire__titre" }, "Choisissez la situation de départ"),
          h("div", { className: "rp-scenarios", role: "radiogroup", "aria-label": "Scénario" },
            M.scenarios.map((s) => {
              const ok = M.premiumOk(s.produit);
              return h("button", {
                key: s.id, type: "button", role: "radio", "aria-checked": scenario === s.id,
                className: cx("rp-scenario", scenario === s.id && "rp-scenario--choisi", !ok && "rp-scenario--verrou"),
                onClick: () => (ok ? setScenario(s.id) : onPremium(s.produit)),
              },
                h("span", { className: "rp-scenario__nom" }, s.nom),
                h("span", { className: "rp-scenario__texte" }, s.accroche),
                !ok && h(Tampon, { ton: "gris", petit: true }, "Premium"));
            })),
          h("div", { className: "rp-formulaire__pied" }, h(Bouton, { taille: "grand", onClick: () => setEtape(2) }, "Suivant : votre camp")))
      : h("main", { className: "rp-formulaire" },
          h("h1", { className: "rp-formulaire__titre" }, "Votre camp à l'Assemblée"),
          h("p", { className: "rp-formulaire__chapo" }, "Votre groupe vote vos lois avec discipline. Les groupes voisins sont des alliés naturels. Personne n'a la majorité seul : il faut 51 voix."),
          h("div", { className: "rp-camps" },
            h("div", { className: "rp-camps__hemi" },
              h(Hemicycle, { segments: segs, camp, taille: 420, centre: [String(sieges[camp] + allies.reduce((a, id) => a + sieges[id], 0)), "avec vos alliés"] })),
            h("div", { className: "rp-camps__liste", role: "radiogroup", "aria-label": "Camp" },
              ORDRE_PARTIS.map((id) => {
                const p = PARTIS[id];
                return h("button", { key: id, type: "button", role: "radio", "aria-checked": camp === id, className: cx("rp-camp", camp === id && "rp-camp--choisi"), onClick: () => setCamp(id), style: { "--c": p.couleur } },
                  h("span", { className: "rp-camp__puce" }),
                  h("span", { className: "rp-camp__nom" }, p.nom),
                  h("span", { className: "rp-camp__sieges" }, `${p.sieges} sièges`),
                  camp !== id && M.allie(camp, id) && h("span", { className: "rp-camp__allie" }, "allié naturel"));
              }),
              h(Doctrine, { key: camp, partiId: camp, sieges: sieges[camp], detaillee: true, defiler: false }))),
          h("label", { className: cx("rp-tuto-choix", tutoriel && "rp-tuto-choix--actif") },
            h("input", { type: "checkbox", checked: tutoriel, onChange: (e) => setTutoriel(e.target.checked) }),
            h(Hector, { humeur: tutoriel ? "content" : "neutre", taille: 58 }),
            h("span", null, h("strong", null, "Jouer avec le tutoriel"), h("small", null, "Hector, votre conseiller, vous guide pas à pas pendant les deux premiers trimestres. Recommandé pour une première partie."))),
          h("div", { className: "rp-formulaire__pied" }, h(Bouton, { taille: "grand", onClick: () => onLancer({ scenarioId: scenario, camp, tutoriel }) }, "Entrer à l'Élysée"))));
}

function CarteTutoriel({ remplace, onLancer }) {
  const [confirmer, setConfirmer] = useState(false);
  return h("div", { className: "rp-carte-tuto" },
    h(Hector, { humeur: "content", taille: 64 }),
    h("div", { className: "rp-carte-tuto__texte" },
      h("strong", null, "Première fois ? Apprenez à jouer avec Hector"),
      h("span", null, confirmer
        ? "Le tutoriel lance une nouvelle partie : votre mandat en cours sera remplacé."
        : "Un tutoriel pas à pas : vos premières études, votre premier vote à l'Assemblée.")),
    confirmer
      ? h("div", { className: "rp-carte-tuto__actions" },
          h(Bouton, { taille: "petit", variante: "ligne", onClick: () => setConfirmer(false) }, "Annuler"),
          h(Bouton, { taille: "petit", className: "rp-btn--jaune", onClick: onLancer }, "Oui, lancer"))
      : h(Bouton, { className: "rp-btn--jaune", onClick: () => (remplace ? setConfirmer(true) : onLancer()) }, "Jouer le tutoriel"));
}

function Marque({ compacte }) {
  return h("div", { className: cx("rp-marque", compacte && "rp-marque--compacte") },
    h("span", { className: "rp-marque__embleme", "aria-hidden": true },
      h("i", { style: { background: "var(--bleu)" } }), h("i", { style: { background: "#fff" } }), h("i", { style: { background: "var(--rouge)" } }),
      h("b", null, "R")),
    h("span", { className: "rp-marque__nom" }, "La République", h("small", null, "des 1 000")));
}
