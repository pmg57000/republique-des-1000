/* ---------- Coque de jeu : bandeau, étapes du trimestre, navigation, tableau de bord ---------- */
const ONGLETS = [
  { id: "trimestre", lib: "Trimestre", icone: "journal" },
  { id: "reformes", lib: "Réformes", icone: "lois" },
  { id: "assemblee", lib: "Assemblée", icone: "hemicycle" },
  { id: "gouvernement", lib: "Gouvernement", icone: "conseil" },
  { id: "pays", lib: "Pays", icone: "village" },
  { id: "archives", lib: "Archives", icone: "livre" },
];
const ANCIENS_ONGLETS = { bilan: "trimestre", lois: "reformes", conseil: "gouvernement", village: "pays", stats: "pays" };

const decisionsEnAttente = (p) => {
  const lst = [];
  if (M.pmRequis(p)) lst.push("pm");
  if (p.crise && !p.crise.refusee) lst.push("mes");
  p.evenements.courants.forEach((ev, i) => { if (ev.choix && !ev.resolu) lst.push(`evt${i}`); });
  return lst;
};

function prochaineEtape(p) {
  const dec = decisionsEnAttente(p);
  if (p.phase === "fin" || p.fin) return { temps: 2, lib: "Mandat terminé", bouton: "Voir le bilan du mandat", action: "fin" };
  if (p.crisePolitique) return { temps: 2, lib: "Gouvernement renversé", bouton: "Aller à l'Assemblée", action: "assemblee", urgent: true };
  if (M.pmRequis(p)) return { temps: p.phase === "bilan" ? 0 : 1, lib: "Formation du gouvernement", bouton: "Nommer un Premier ministre", action: "decisions", urgent: true };
  if (p.phase === "bilan" && dec.length) return { temps: 0, lib: "Décision requise", bouton: p.crise && !p.crise.refusee ? "Examiner l'offre du MES" : "Trancher la décision", action: "decisions", urgent: true };
  if (p.phase === "bilan") return { temps: 0, lib: "Bilan du trimestre", bouton: "Ouvrir la session", action: "ouvrir" };
  if (p.phase === "assemblee") {
    if (p.vote?.statut === "debat") return { temps: 2, lib: "Projet en séance", bouton: "Aller en séance", action: "assemblee" };
    return { temps: 2, lib: "Résultat du vote", bouton: p.pap > 0 ? "Continuer la session" : "Clore le trimestre", action: p.pap > 0 ? "continuer" : "clore" };
  }
  return { temps: 1, lib: "Session parlementaire", bouton: "Clore le trimestre", action: "clore" };
}

function Etapes({ temps, compact }) {
  const lib = ["Bilan", "Session", "Séance"];
  return h("ol", { className: cx("rp-etapes", compact && "rp-etapes--compact"), "aria-label": "Étapes du trimestre" },
    lib.map((l, i) => h("li", { key: l, className: cx("rp-etapes__item", i < temps && "rp-etapes__item--fait", i === temps && "rp-etapes__item--actif"), "aria-current": i === temps ? "step" : undefined },
      h("span", { className: "rp-etapes__num" }, i + 1), h("span", { className: "rp-etapes__lib" }, l))));
}

function ProgressionMandat({ n, total }) {
  return h("span", { className: "rp-mandat", role: "img", "aria-label": `Trimestre ${n} sur ${total}` },
    Array.from({ length: total }, (_, i) => h("i", { key: i, className: cx(i < n - 1 && "rp-mandat--fait", i === n - 1 && "rp-mandat--actuel", i === total - 1 && "rp-mandat--election") })));
}

function Bandeau({ partie, info, etape, onAction, onAide, onReglages, onTuto }) {
  return h("header", { className: "rp-bandeau" },
    h("div", { className: "rp-tricolore", "aria-hidden": true }),
    h("div", { className: "rp-bandeau__rang" },
      h(Marque, { compacte: true }),
      h("div", { className: "rp-bandeau__date" },
        h("span", { className: "rp-bandeau__trimestre" }, info.libelle),
        h("span", { className: "rp-bandeau__mandat" }, `Trimestre ${info.tourMandat}/${info.toursParMandat} · Mandat ${partie.mandat}`, info.regime?.id && info.regime.id !== "democratie" ? ` · ${info.regime.court || info.regime.nom}` : ""),
        h(ProgressionMandat, { n: info.tourMandat, total: info.toursParMandat })),
      h(Etapes, { temps: etape.temps }),
      h(BoutonFiche, { id: "pap", className: "rp-bandeau__pap", titre: `${partie.pap} point${partie.pap > 1 ? "s" : ""} d'action : explications` },
        h(Jetons, { n: partie.pap, max: info.papMax }),
        h("span", null, h("strong", null, partie.pap), " point", partie.pap > 1 ? "s" : "", " d'action")),
      h(Prochaine, { partie, etape, onAction, variante: "bandeau" }),
      h("div", { className: "rp-bandeau__outils" },
        h(M.BoutonSon, { className: "rp-outil" }),
        h("button", { type: "button", className: "rp-outil rp-outil--tuto", onClick: onTuto, "aria-label": "Tutoriel avec Hector", title: "Tutoriel" }, h("svg", { viewBox: "0 0 24 24", width: 20, height: 20, "aria-hidden": true }, h("path", { d: "M2 9.5 12 5l10 4.5-10 4.5Zm4 2.3V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.2M21 10v5", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" })), h("span", { className: "rp-outil__lib" }, "Tutoriel")),
        h("button", { type: "button", className: "rp-outil", onClick: onAide, "aria-label": "Aide" }, "?"),
        h("button", { type: "button", className: "rp-outil", onClick: onReglages, "aria-label": "Réglages" }, h(Icone, { nom: "reglages", taille: 18 })))));
}

function Navigation({ onglet, setOnglet, partie }) {
  const rapports = M.rapportsPrets(partie).length;
  const dec = decisionsEnAttente(partie).length > 0 || !!partie.crisePolitique;
  const vote = partie.phase === "assemblee";
  const badge = { trimestre: dec ? "!" : null, reformes: rapports || null, assemblee: vote ? "●" : null };
  return h("nav", { className: "rp-nav", "aria-label": "Navigation principale" },
    ONGLETS.map((o) => h("button", {
      key: o.id, type: "button", "data-onglet": o.id, className: cx("rp-nav__onglet", onglet === o.id && "rp-nav__onglet--actif"),
      "aria-current": onglet === o.id ? "page" : undefined, onClick: () => setOnglet(o.id),
    },
      h(Icone, { nom: o.icone, taille: 19 }),
      h("span", null, o.lib),
      badge[o.id] != null && h("b", { className: cx("rp-nav__badge", o.id === "trimestre" && "rp-nav__badge--urgent") }, badge[o.id]))));
}

const FICHE_JAUGE = { santeFinanciere: "finances", cohesionSociale: "cohesion", productiviteEmploi: "emploi" };
function TableauDeBord({ partie, info, vertical }) {
  const { fiche } = useExplications();
  const avant = partie.rapport?.precedent;
  const jauges = JAUGES.map(([cle, lib, aide]) => ({ cle, lib, aide, v: info.jauges[cle], d: avant?.jauges ? info.jauges[cle] - avant.jauges[cle] : null }));
  const pop = info.regime?.censure ? null : info.popularite * 100;
  const dpop = avant && pop != null ? pop - avant.popularite * 100 : null;
  return h("section", { className: cx("rp-tdb", vertical && "rp-tdb--vertical"), "aria-label": "Tableau de bord" },
    vertical && h(Surtitre, null, `Le pays · ${avant ? `depuis ${M.libTour(avant.tour)}` : "au départ"}`),
    h("div", { className: "rp-tdb__jauges" },
      jauges.map((j) => h(Jauge, { key: j.lib, lib: j.lib, valeur: j.v, delta: j.d, aide: j.aide, compacte: !vertical, onClick: () => fiche(FICHE_JAUGE[j.cle]) })),
      h(Jauge, { lib: "Popularité", valeur: pop, delta: dpop, suffixe: " %", aide: "Il faut 50 % à l'élection", compacte: !vertical, onClick: () => fiche("popularite") })),
    vertical && h("dl", { className: "rp-tdb__chiffres" },
      h("div", null, h("dt", null, "Déficit"), h("dd", null, `${M.argent(info.deficit)} par an`)),
      h("div", null, h("dt", null, "Dette"), h("dd", null, M.argent(info.dette))),
      h("div", null, h("dt", null, "Chômage"), h("dd", null, `${nb(info.chomage, 1)} %`)),
      h("div", null, h("dt", null, "Note"), h("dd", null, h(BoutonFiche, { id: "note", className: "rp-boutonfiche--texte", titre: "Note du pays : explications" }, info.notation?.note || "—")))),
    info.tension > 0 && h("p", { className: "rp-tdb__alerte" }, h(Icone, { nom: "alerte", taille: 16 }), ` ${info.libelleTension} · ordre public ${nb(info.ordrePublic, 0)}`));
}

function Prochaine({ partie, etape, onAction, variante }) {
  return h("div", { className: cx("rp-prochaine", `rp-prochaine--${variante}`, etape.urgent && "rp-prochaine--urgent") },
    h("div", { className: "rp-prochaine__texte" },
      h(Surtitre, null, etape.lib),
      variante !== "dock" && h("p", null, h(Jetons, { n: partie.pap, max: partie.regles.papParTrimestre, petit: true }), ` ${partie.pap} point${partie.pap > 1 ? "s" : ""} d'action`)),
    h(Bouton, { variante: etape.urgent ? "rouge" : "plein", onClick: () => onAction(etape.action), className: "rp-prochaine__btn" }, etape.bouton));
}
