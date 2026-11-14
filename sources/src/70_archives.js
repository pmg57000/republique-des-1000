/* ---------- Archives : bilans, rapports, scrutins, unes ---------- */
function BilanArchive({ partie, k, ouvert, onBasculer, onUne, onDossier }) {
  const av = partie.historique.find((x) => x.tour === k - 1) || partie.historique[0];
  const ap = partie.historique.find((x) => x.tour === k);
  const une = partie.archives.find((u) => u.tour === k + 1);
  const entrees = partie.journal.filter((e) => e.tour === k);
  if (!ap) return null;
  const adoptees = entrees.filter((e) => e.type === "vote" && e.loiId).length, rejetees = entrees.filter((e) => e.type === "vote" && e.loiRejetee).length;
  const jauges = JAUGES.map(([cle, lib]) => ({ lib, d: ap.jauges[cle] - av.jauges[cle] })).concat([{ lib: "Popularité", d: (ap.popularite - av.popularite) * 100 }]);
  return h("article", { className: cx("rp-archive", ouvert && "rp-archive--ouvert") },
    h("button", { type: "button", className: "rp-archive__tete", onClick: onBasculer, "aria-expanded": ouvert },
      h("span", { className: "rp-archive__tour" }, M.libTour(k)),
      h("span", { className: "rp-archive__titre" }, une?.titre || "Trimestre", h("small", null, `${adoptees} loi${adoptees > 1 ? "s" : ""} adoptée${adoptees > 1 ? "s" : ""} · ${rejetees} rejet${rejetees > 1 ? "s" : ""} · ${entrees.filter((e) => e.type === "evenement").length} événement(s)`)),
      h(DeltaJauges, { jauges })),
    ouvert && h("div", { className: "rp-archive__corps" },
      h("div", { className: "rp-bilan__grille" },
        h(Section, { titre: "Ce qui a changé", className: "rp-carte" }, h(AvantApres, { avant: av, apres: ap })),
        h(Section, { titre: "Les chiffres", className: "rp-carte" }, h(Chiffres, { avant: av, apres: ap }))),
      h(Section, { titre: "Ce qui s'est passé", className: "rp-carte" }, h(Journal, { entrees })),
      une && h(Bouton, { variante: "ligne", onClick: () => onUne(une) }, `Relire la Une du ${M.libTour(une.tour)}`)));
}

function EcranArchives({ partie, onDossier, onUne }) {
  const [vue, setVue] = useState("bilans");
  const [ouvert, setOuvert] = useState(null);
  const tours = partie.historique.filter((x) => x.tour >= 1).map((x) => x.tour).reverse();
  const prets = M.rapportsPrets(partie), cours = M.etudesEnCours(partie);
  const adoptees = Object.entries(partie.lois.adoptees).sort((a, b) => b[1] - a[1]);
  const nbScrutins = registreScrutins(partie).length;
  const VUES_A = [["bilans", "Bilans", tours.length], ["rapports", "Rapports d'impact", prets.length + adoptees.length + cours.length], ["scrutins", "Scrutins", nbScrutins], ["unes", "Unes", partie.archives.length]];
  const ligneLoi = (id, tampon, tonT) => h("li", { key: id }, h(Tampon, { ton: tonT, petit: true }, tampon),
    h("button", { type: "button", className: "rp-lien", onClick: () => onDossier(id) }, M.lois[id].titre), h("small", null, minCourt(M.lois[id].ministere)));
  return h("div", { className: "rp-page rp-archives" },
    h("header", { className: "rp-page__tete" },
      h(Surtitre, null, "Mémoire du mandat"),
      h("h1", { className: "rp-page__titre" }, "Archives"),
      h("p", { className: "rp-page__chapo" }, "Chaque bilan trimestriel, chaque rapport d'impact, chaque scrutin et chaque Une, rangés au même endroit.")),
    h("div", { className: "rp-segments", role: "tablist", "aria-label": "Archives" }, VUES_A.map(([id, lib, n]) => h("button", { key: id, type: "button", role: "tab", "aria-selected": vue === id, className: cx("rp-segment", vue === id && "rp-segment--actif"), onClick: () => setVue(id) }, lib, h("b", null, n)))),
    vue === "bilans" && (tours.length
      ? h("div", { className: "rp-archives__liste" }, tours.map((k) => h(BilanArchive, { key: k, partie, k, ouvert: ouvert === k, onBasculer: () => setOuvert(ouvert === k ? null : k), onUne, onDossier })))
      : h(Vide, null, "Le premier bilan arrivera à la fin du premier trimestre.")),
    vue === "rapports" && h("div", { className: "rp-archives__rapports" },
      h(Section, { titre: "Rapports prêts", className: "rp-carte" }, prets.length ? h("ul", { className: "rp-liste-lois" }, prets.map((id) => ligneLoi(id, "Rapport prêt", "vert"))) : h(Vide, null, "Aucun rapport en attente de vote.")),
      h(Section, { titre: "Études en cours", className: "rp-carte" }, cours.length ? h("ul", { className: "rp-liste-lois" }, cours.map((id) => ligneLoi(id, `Rapport ${M.libTour(M.etude(partie, id).prete)}`, "ambre"))) : h(Vide, null, "Aucune étude commandée.")),
      h(Section, { titre: "Lois en vigueur", className: "rp-carte" }, adoptees.length ? h("ul", { className: "rp-liste-lois" }, adoptees.map(([id, t]) => ligneLoi(id, M.libTour(t), "bleu"))) : h(Vide, null, "Aucune loi adoptée pour l'instant."))),
    vue === "scrutins" && h(Section, { className: "rp-carte" }, h(Registre, { partie, onDossier })),
    vue === "unes" && h("div", { className: "rp-unes" }, partie.archives.slice().reverse().map((u) => h("button", { key: `${u.tour}-${u.numero}`, type: "button", className: "rp-une-mini", onClick: () => onUne(u) },
      h("span", { className: "rp-une-mini__bandeau" }, `n° ${u.numero} · ${u.date}`),
      h("strong", null, u.titre),
      u.article?.[0] && h("span", { className: "rp-une-mini__chapo" }, u.article[0])))));
}

function EcranPays({ partie, onPremium }) {
  const [vue, setVue] = useState("population");
  return h("div", { className: "rp-page rp-pays" },
    h("header", { className: "rp-page__tete" },
      h(Surtitre, null, "1 000 citoyens"),
      h("h1", { className: "rp-page__titre" }, "Le Pays"),
      h("div", { className: "rp-segments", role: "tablist", "aria-label": "Le Pays" },
        [["population", "Population"], ["indicateurs", "Indicateurs"], ["objectifs", "Objectifs"]].map(([id, lib]) => h("button", { key: id, type: "button", role: "tab", "aria-selected": vue === id, className: cx("rp-segment", vue === id && "rp-segment--actif"), onClick: () => setVue(id) }, lib)))),
    h("div", { className: "rp-reutilise" },
      vue === "population" && h(M.Population, { partie }),
      vue === "indicateurs" && h(M.Indicateurs, { partie, onPremium }),
      vue === "objectifs" && h("div", { className: "rp-objectifs" }, h(M.Victoires, { partie }), h(M.Statuts, { partie }), h(M.Boussole, { partie }))));
}

function EcranGouvernement({ partie, agir }) {
  return h("div", { className: "rp-page rp-gouvernement" },
    h("header", { className: "rp-page__tete" },
      h(Surtitre, null, "Hôtel de Matignon · Conseil des ministres"),
      h("h1", { className: "rp-page__titre" }, "Gouvernement")),
    M.pmRequis(partie) && h("div", { className: "rp-carte rp-decision--pm" }, h(M.NominationPM, { partie, agir })),
    h("div", { className: "rp-reutilise" }, h(M.Gouvernement, { partie, agir })));
}
