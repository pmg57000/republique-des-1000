/* ---------- Réformes : parapheur, catalogue en chemises, comparateur, dossier ---------- */
const VUES = [["toutes", "Toutes"], ["rapports", "Rapports prêts"], ["etudes", "À l'étude"], ["vigueur", "En vigueur"]];
const TRIS = [["pertinence", "Pertinence"], ["rapporte", "Rapporte le plus"], ["coute", "Coûte le plus"], ["soutien", "Mieux accueillies"]];
const norm = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/’/g, "'").toLowerCase();
const RANG_ETAT = { vote: 0, rapport: 1, etude: 2, fiche: 3, libre: 3, vigueur: 4 };

const phrase = (lib, l) => (l.length ? `${lib} : ${l.join(", ")}${/\.$/.test(l[l.length - 1]) ? "" : "."}` : "");
function BadgeBudget({ loi, grand }) {
  const v = loi.impactAnnuel || 0;
  return h("span", { className: cx("rp-budget", grand && "rp-budget--grand", v > 500 ? "rp-budget--rapporte" : v < -500 ? "rp-budget--coute" : "rp-budget--neutre"), title: "Effet annuel sur le budget de l'État" },
    h("small", null, v > 500 ? "Rapporte" : v < -500 ? "Coûte" : "Budget"), h("b", null, v > 500 || v < -500 ? `${M.montant(Math.abs(v))}/an` : "neutre"));
}
function ListeGroupes({ ids, ton: t, max = 4 }) {
  if (!ids.length) return null;
  const vis = ids.slice(0, max);
  return h("span", { className: `rp-groupes rp-groupes--${t}` }, t === "bon" ? "▲ " : "▼ ", vis.map((id) => GROUPES[id].court).join(", "), ids.length > max ? ` +${ids.length - max}` : "");
}

function Parapheur({ partie, onDossier }) {
  const cours = M.etudesEnCours(partie), prets = M.rapportsPrets(partie), max = M.limitesEtudes.max;
  if (!M.etudeRequise(partie)) return null;
  return h("section", { className: "rp-parapheur", "aria-label": "Parapheur" },
    h("div", { className: "rp-parapheur__bloc" },
      h(Surtitre, null, `Études d'impact · ${cours.length}/${max}`),
      h("div", { className: "rp-parapheur__fentes" },
        Array.from({ length: max }, (_, i) => {
          const id = cours[i];
          if (!id) return h("div", { key: i, className: "rp-fente rp-fente--vide" }, h("span", null, "Emplacement libre"), h("small", null, "Choisissez un projet ci-dessous"));
          const et = M.etude(partie, id);
          return h("button", { key: i, type: "button", className: "rp-fente", onClick: () => onDossier(id), style: { "--rp-min": minCouleur(M.lois[id].ministere) } },
            h(Tampon, { ton: "ambre", petit: true }, `Rapport ${M.libTour(et.prete)}`), h("strong", null, M.lois[id].titre));
        }))),
    h("div", { className: "rp-parapheur__bloc" },
      h(Surtitre, null, `Rapports prêts · ${prets.length}`),
      prets.length
        ? h("div", { className: "rp-parapheur__prets" }, prets.map((id) => h("button", { key: id, type: "button", className: "rp-fente rp-fente--prete", onClick: () => onDossier(id), style: { "--rp-min": minCouleur(M.lois[id].ministere) } },
            h(Tampon, { ton: "vert", petit: true }, "Rapport prêt"), h("strong", null, M.lois[id].titre))))
        : h("p", { className: "rp-discret" }, "Les rapports arrivent au trimestre qui suit la commande.")),
    h("div", { className: "rp-parapheur__bloc rp-parapheur__pap" },
      h(Surtitre, null, "Points d'action"),
      h(Jetons, { n: partie.pap, max: partie.regles.papParTrimestre }),
      h("p", { className: "rp-discret" }, "Un dépôt coûte 1 ou 2 points. Non reportables.")));
}

function Chemise({ partie, loi, onOuvrir, compare, onCompare, compareplein, idx = 0 }) {
  const etat = etatDossier(partie, loi), f = fiche(loi);
  return h("article", { className: cx("rp-chemise", `rp-chemise--${etat.cle}`), style: { "--rp-min": minCouleur(loi.ministere), "--i": idx % 12 } },
    h("div", { className: "rp-chemise__onglet" }, minCourt(loi.ministere)),
    h("button", { type: "button", className: "rp-chemise__corps", onClick: onOuvrir },
      h("span", { className: "rp-chemise__etat" }, h(Tampon, { ton: etat.ton, petit: true }, etat.lib)),
      pactesPourLoi(partie, loi).length > 0 && !(loi.id in partie.lois.adoptees) && h("span", { className: "rp-chemise__pacte", title: "Déposer cette loi tient une promesse faite à l'investiture" }, "✍ Tient le pacte « ", pactesPourLoi(partie, loi)[0].nom, " »"),
      h("h3", { className: "rp-chemise__titre" }, loi.titre),
      h("p", { className: "rp-chemise__resume" }, loi.resume),
      h("span", { className: "rp-chemise__meta" },
        h(BadgeBudget, { loi }),
        h("span", { className: "rp-chemise__cout", title: "Coût du dépôt en points d'action" }, h(Jetons, { n: loi.coutPAP, max: loi.coutPAP, petit: true }), ` ${loi.coutPAP} pt`),
        h(Spectre, { loi })),
      h("span", { className: "rp-chemise__groupes" }, h(ListeGroupes, { ids: f.gagnants, ton: "bon", max: 3 }), h(ListeGroupes, { ids: f.perdants, ton: "mauvais", max: 3 }))),
    h("label", { className: cx("rp-chemise__comparer", compare && "rp-chemise__comparer--actif") },
      h("input", { type: "checkbox", checked: compare, disabled: !compare && compareplein, onChange: onCompare }),
      compare ? "Dans le comparateur" : "Comparer"));
}

function EcranReformes({ partie, onDossier, comparaison, setComparaison, onComparer }) {
  const [q, setQ] = useState("");
  const [min, setMin] = useState("");
  const [vue, setVue] = useState(() => (M.rapportsPrets(partie).length ? "rapports" : "toutes"));
  const [tri, setTri] = useState("pertinence");
  const [limite, setLimite] = useState(36);
  useEffect(() => setLimite(36), [q, min, vue, tri]);
  const prets = M.rapportsPrets(partie), cours = M.etudesEnCours(partie);
  const compte = { toutes: M.catalogue.length, rapports: prets.length, etudes: cours.length, vigueur: Object.keys(partie.lois.adoptees).length };
  const lois = useMemo(() => {
    const nq = norm(q.trim());
    let l = M.catalogue.filter((loi) => {
      if (min && loi.ministere !== min) return false;
      if (vue === "rapports" && !prets.includes(loi.id)) return false;
      if (vue === "etudes" && !cours.includes(loi.id)) return false;
      if (vue === "vigueur" && !(loi.id in partie.lois.adoptees)) return false;
      if (nq && !norm(`${loi.titre} ${loi.sujet || ""} ${loi.resume}`).includes(nq)) return false;
      return true;
    });
    const rang = (loi) => RANG_ETAT[etatDossier(partie, loi).cle] ?? 3;
    const pacte = (loi) => (pactesPourLoi(partie, loi).length && !(loi.id in partie.lois.adoptees) ? 0 : 1);
    if (tri === "pertinence") l = l.map((loi, i) => [loi, rang(loi), pacte(loi), i]).sort((a, b) => a[1] - b[1] || a[2] - b[2] || a[3] - b[3]).map((x) => x[0]);
    if (tri === "rapporte") l = l.slice().sort((a, b) => (b.impactAnnuel || 0) - (a.impactAnnuel || 0));
    if (tri === "coute") l = l.slice().sort((a, b) => (a.impactAnnuel || 0) - (b.impactAnnuel || 0));
    if (tri === "soutien") l = l.slice().sort((a, b) => fiche(b).pourSieges - fiche(a).pourSieges);
    return l;
  }, [q, min, vue, tri, partie]);
  const basculer = (id) => setComparaison((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 3 ? c : [...c, id]));
  return h("div", { className: "rp-page rp-reformes" },
    h("header", { className: "rp-page__tete" },
      h(Surtitre, null, `Travail législatif · ${M.libTour(partie.tour)}`),
      h("h1", { className: "rp-page__titre" }, "Réformes"),
      h("p", { className: "rp-page__chapo" }, M.etudeRequise(partie)
        ? "Chaque projet suit la même chaîne : la fiche (lisible tout de suite), l'étude d'impact (rapport au trimestre suivant), puis le vote. Comparez avant de commander."
        : "Ouvrez un projet pour lire son rapport d'impact, puis déposez-le.")),
    h(Parapheur, { partie, onDossier }),
    h("div", { className: "rp-filtres" },
      h("div", { className: "rp-segments", role: "tablist", "aria-label": "Vue" },
        VUES.map(([id, lib]) => h("button", { key: id, type: "button", role: "tab", "aria-selected": vue === id, className: cx("rp-segment", vue === id && "rp-segment--actif"), onClick: () => setVue(id) },
          lib, h("b", null, compte[id])))),
      h("div", { className: "rp-filtres__rang" },
        h("input", { type: "search", className: "rp-champ", placeholder: "Rechercher : TVA, retraite, logement…", value: q, onChange: (e) => setQ(e.target.value), "aria-label": "Rechercher une réforme" }),
        h("select", { className: "rp-champ rp-champ--select", value: tri, onChange: (e) => setTri(e.target.value), "aria-label": "Trier" }, TRIS.map(([id, lib]) => h("option", { key: id, value: id }, lib)))),
      h("div", { className: "rp-puces-min", role: "group", "aria-label": "Ministères" },
        h("button", { type: "button", className: cx("rp-puce-min", !min && "rp-puce-min--actif"), onClick: () => setMin("") }, "Tous"),
        M.ministeres.map((m) => h("button", { key: m.id, type: "button", className: cx("rp-puce-min", min === m.id && "rp-puce-min--actif"), style: { "--rp-min": minCouleur(m.id) }, onClick: () => setMin(min === m.id ? "" : m.id), title: m.nom }, minCourt(m.id))))),
    h("p", { className: "rp-resultat", role: "status" }, lois.length ? `${lois.length} projet${lois.length > 1 ? "s" : ""}` : "Aucun projet dans cette vue."),
    h("div", { className: "rp-catalogue" }, lois.slice(0, limite).map((loi, idx) => h(Chemise, {
      key: loi.id, partie, loi, idx, onOuvrir: () => onDossier(loi.id), compare: comparaison.includes(loi.id), compareplein: comparaison.length >= 3, onCompare: () => basculer(loi.id),
    }))),
    lois.length > limite && h("div", { className: "rp-plus-loin" }, h(Bouton, { variante: "ligne", onClick: () => setLimite(limite + 48) }, `Afficher plus (${lois.length - limite} restants)`)),
    comparaison.length > 0 && h("div", { className: "rp-tiroir", role: "region", "aria-label": "Comparateur" },
      h("div", { className: "rp-tiroir__lois" }, comparaison.map((id) => h("span", { key: id, className: "rp-tiroir__loi", style: { "--rp-min": minCouleur(M.lois[id].ministere) } },
        M.lois[id].titre, h("button", { type: "button", onClick: () => basculer(id), "aria-label": `Retirer ${M.lois[id].titre}` }, "×")))),
      h(Bouton, { onClick: onComparer, disabled: comparaison.length < 2 }, comparaison.length < 2 ? "Choisissez un 2e projet" : `Comparer ${comparaison.length} projets`)));
}

/* ---------- Données de l'étude d'impact (simulation du moteur) ---------- */
function rapportImpact(partie, loi) {
  const ap = M.apercuLoi(partie, loi.id);
  const jauges = JAUGES.map(([cle, lib]) => ({ lib, d: ap.an1.avec.jauges[cle] - ap.an1.sans.jauges[cle] }))
    .concat([{ lib: "Popularité", d: (ap.an1.avec.popularite - ap.an1.sans.popularite) * 100 }]);
  const groupes = M.groupes.map((g) => ({ id: g.id, d: ap.an1.avec.groupes[g.id].sat - ap.an1.sans.groupes[g.id].sat })).filter((g) => Math.abs(g.d) >= 0.5).sort((a, b) => b.d - a.d);
  return { ap, jauges, groupes };
}
const LIGNES_PREVISION = [
  ["Déficit", (s) => s.deficit / 1e6, (v) => `${nb(v, 2)} M€`, -1, 2],
  ["Chômeurs", (s) => s.chomeurs, (v) => nb(v, 0), -1, 0],
  ["Croissance", (s) => s.croissanceGA * 100, (v) => `${nb(v, 1)} %`, 1, 1],
  ["Taux d'emprunt", (s) => s.taux, (v) => `${nb(v, 2)} %`, -1, 2],
  ["Popularité", (s) => s.popularite * 100, (v) => `${nb(v, 0)} %`, 1, 0],
  ["Colère sociale", (s) => s.colere, (v) => nb(v, 0), -1, 0],
];

function DeltaJauges({ jauges, grand }) {
  return h("div", { className: cx("rp-deltas", grand && "rp-deltas--grand") }, jauges.map((j) => h("div", { key: j.lib, className: `rp-delta rp-delta--${ton(j.d)}` },
    h("span", null, j.lib), h("strong", null, Math.abs(j.d) < 0.5 ? "=" : `${j.d > 0 ? "+" : "−"}${nb(Math.abs(j.d), 0)}`))));
}

function LigneParti({ pos, partie, negociation, onNegocier }) {
  const p = PARTIS[pos.parti];
  const lean = pos.prob >= 0.65 ? ["Pour", "bon"] : pos.prob >= 0.35 ? ["Indécis", "veille"] : ["Contre", "mauvais"];
  const contenu = [
    h("span", { key: "c", className: "rp-parti__puce", style: { background: p.couleur } }),
    h("span", { key: "n", className: "rp-parti__nom" }, p.court, h("small", null, ` ${pos.sieges} sièges`), pos.parti === partie.camp && h("em", null, " · votre camp")),
    h("span", { key: "b", className: "rp-parti__barre", "aria-hidden": true }, h("i", { style: { width: `${pos.prob * 100}%`, background: p.couleur } })),
    h(Pastille, { key: "t", ton: lean[1] }, `${lean[0]} ${nb(pos.prob * 100, 0)} %`),
  ];
  if (onNegocier) {
    const peut = pos.parti !== partie.camp && !negociation;
    return h("button", { type: "button", className: "rp-parti rp-parti--bouton", disabled: !peut, onClick: () => onNegocier(pos.parti) },
      contenu, h("span", { className: "rp-parti__action" }, pos.parti === partie.camp ? "discipliné" : negociation ? (negociation === "promesse" ? "promesse faite" : "concession faite") : "Négocier →"));
  }
  return h("div", { className: "rp-parti" }, contenu);
}

function ChaineDossier({ etat }) {
  const ordre = ["fiche", "etude", "rapport", "vote", "vigueur"];
  const i = Math.max(0, ordre.indexOf(etat.cle === "libre" ? "rapport" : etat.cle));
  const lib = ["Fiche", "Étude", "Rapport", "Vote", "En vigueur"];
  return h("ol", { className: "rp-chaine", "aria-label": "Avancement du projet" }, lib.map((l, k) => h("li", { key: l, className: cx(k < i && "rp-chaine--fait", k === i && "rp-chaine--actif") }, l)));
}

function Dossier({ partie, loiId, onFermer, onEtude, onAbandon, onDeposer, onPromulguer, comparaison, onCompare }) {
  const loi = M.lois[loiId];
  const st = M.statutLoi(partie, loi);
  const etat = etatDossier(partie, loi);
  const f = fiche(loi), ori = orientation(loi);
  const pret = !st.adoptee && (!M.etudeRequise(partie) || st.etude?.etat === "prete");
  const imp = useMemo(() => (pret ? rapportImpact(partie, loi) : null), [partie, loiId, pret]);
  const peutEtudier = M.peutEtudier(partie, loi.id);
  const decret = M.decrets(partie);
  const libDepot = decret ? (partie.regime?.id === "commune" ? "Faire adopter en Comité central" : "Promulguer par décret") : "Soumettre au vote";
  let pied;
  if (st.adoptee) pied = h("p", { className: "rp-discret" }, `En vigueur depuis ${M.libTour(partie.lois.adoptees[loi.id])}.`);
  else if (pret) pied = h("div", { className: "rp-pied-actions" },
    st.etude && h(Bouton, { variante: "ligne", onClick: () => onAbandon(loi.id) }, "Abandonner"),
    h(Bouton, { disabled: !st.disponible, onClick: () => (decret ? onPromulguer : onDeposer)(loi.id), className: "rp-pied-actions__principal" }, st.disponible ? `${libDepot} · ${loi.coutPAP} point${loi.coutPAP > 1 ? "s" : ""}` : raison(st.raisons[0])));
  else if (st.etude?.etat === "cours") pied = h("div", { className: "rp-pied-actions" },
    h(Bouton, { variante: "ligne", onClick: () => onAbandon(loi.id) }, "Annuler l'étude"),
    h(Bouton, { disabled: true, className: "rp-pied-actions__principal" }, `Rapport attendu ${M.libTour(st.etude.prete)}`));
  else pied = h("div", { className: "rp-pied-actions" },
    h(Bouton, { variante: "ligne", onClick: () => onCompare(loi.id), disabled: !comparaison.includes(loi.id) && comparaison.length >= 3 }, comparaison.includes(loi.id) ? "Retirer du comparateur" : "Comparer"),
    h(Bouton, { disabled: !peutEtudier.ok, onClick: () => onEtude(loi.id), className: "rp-pied-actions__principal" }, peutEtudier.ok ? `Commander l'étude d'impact · ${M.etudesEnCours(partie).length}/${M.limitesEtudes.max}` : peutEtudier.raison || "Étude indisponible"));
  const programme = loi.effets.filter((ef) => !/^(revenu|satisfaction|radicalisation)\./.test(ef.cible));
  return h(Panneau, { titre: loi.titre, surtitre: `${MINIS[loi.ministere]?.nom || ""} · ${loi.id}`, onFermer, pied, large: true, className: "rp-dossier", couleur: minCouleur(loi.ministere) },
    h("div", { className: "rp-dossier__tete" },
      h(Tampon, { ton: etat.ton }, etat.lib),
      h(ChaineDossier, { etat })),
    h("p", { className: "rp-dossier__une" }, M.titrePresse(loi)),
    h(Section, { num: "§ 1", titre: "Le projet", className: "rp-dossier__section" },
      h("p", { className: "rp-dossier__expose" }, loi.resume),
      h("div", { className: "rp-dossier__cles" },
        h(BadgeBudget, { loi, grand: true }),
        h("div", { className: "rp-cle" }, h("small", null, "Dépôt"), h("b", null, h(Jetons, { n: loi.coutPAP, max: loi.coutPAP, petit: true }), ` ${loi.coutPAP} point${loi.coutPAP > 1 ? "s" : ""}`)),
        h("div", { className: "rp-cle" }, h("small", null, "Accueil politique"), h(Spectre, { loi, grand: true }))),
      h("dl", { className: "rp-dossier__liste" },
        f.macro.length > 0 && h("div", null, h("dt", null, "Ce que ça change"), h("dd", null, f.macro.join(" · "))),
        (f.gagnants.length > 0 || f.perdants.length > 0 || f.tous) && h("div", null, h("dt", null, "Groupes visés"), h("dd", null,
          f.tous > 0 && h("span", { className: "rp-groupes rp-groupes--bon" }, "▲ tout le monde "),
          f.tous < 0 && h("span", { className: "rp-groupes rp-groupes--mauvais" }, "▼ tout le monde "),
          h(ListeGroupes, { ids: f.gagnants, ton: "bon", max: 6 }), " ", h(ListeGroupes, { ids: f.perdants, ton: "mauvais", max: 6 }))),
        h("div", null, h("dt", null, "Groupes parlementaires"), h("dd", null, phrase("Favorables", ori.fav), " ", phrase("Hostiles", ori.hos), !ori.fav.length && !ori.hos.length ? "Accueil partagé." : ""))),
      !st.adoptee && pactesPourLoi(partie, loi).map((pa) => h("p", { key: pa.id, className: "rp-pacte-info rp-pacte-info--tenu" }, h("b", null, "✍ Pacte de coalition"), ` Déposer ce projet tient le pacte « ${pa.nom} » (${pa.reste <= 0 ? "échéance ce trimestre" : `encore ${pa.reste} trim.`}).`)),
      !st.adoptee && pacteMenace(partie, loi).map((pa) => h("p", { key: pa.id, className: "rp-pacte-info rp-pacte-info--rompu" }, h("b", null, "⚠ Pacte menacé"), ` Ce projet relève l'impôt sur les sociétés : le pacte « ${pa.nom} » serait rompu.`)),
      loi.horsConstitution && h("p", { className: "rp-avertissement" }, h(Glose, null, loi.horsConstitution.texte)),
      loi.ue && h("p", { className: "rp-avertissement" }, h(Terme, { id: "ue" }, "Droit européen"), " : ", h(Glose, null, loi.ue)),
      h("p", { className: "rp-discret" }, "Estimations des services avant étude. L'étude d'impact simule les effets réels sur le Pays et les chances au vote.")),
    h(Section, { num: "§ 2", titre: "L'étude d'impact", className: "rp-dossier__section" },
      st.adoptee
        ? h(Fragment, null, h("p", null, "La loi s'applique. Effets programmés :"),
            h("ul", { className: "rp-programme" }, programme.map((ef, i) => h("li", { key: i }, h("span", null, M.effetTexte(ef)), h("small", null, M.effetDelai(ef))))))
        : !pret
          ? h("div", { className: cx("rp-verrou", st.etude && "rp-verrou--cours") },
              h(Tampon, { ton: st.etude ? "ambre" : "gris" }, st.etude ? `Rapport ${M.libTour(st.etude.prete)}` : "Non commandée"),
              h("p", null, st.etude ? "Les services travaillent. Le rapport arrive au début du prochain trimestre, avec :" : "Commandez l'étude pour connaître :"),
              h("ul", { className: "rp-puces" },
                h("li", null, "l'effet sur les finances, la cohésion, l'emploi et votre popularité dans un an ;"),
                h("li", null, "qui y gagne et qui y perd, groupe par groupe ;"),
                h("li", null, "les chances d'adoption, parti par parti.")),
              !st.etude && h("p", { className: "rp-discret" }, `Gratuit. ${M.limitesEtudes.max} études au plus en même temps.`))
          : h(Fragment, null,
              h("p", { className: "rp-dossier__intro" }, "Dans un an, par rapport à « ne rien faire » :"),
              h(DeltaJauges, { jauges: imp.jauges, grand: true }),
              h("table", { className: "rp-prevision" },
                h("thead", null, h("tr", null, h("th", null, ""), h("th", null, "Sans"), h("th", null, "Avec, 1 trim."), h("th", null, "Avec, 1 an"))),
                h("tbody", null, LIGNES_PREVISION.map(([lib, fn, fmt, sens, dd]) => {
                  const a = fn(imp.ap.an1.sans), b = fn(imp.ap.trimestre1.avec), c = fn(imp.ap.an1.avec), d = c - a;
                  return h("tr", { key: lib }, h("th", null, lib), h("td", null, fmt(a)), h("td", null, fmt(b)),
                    h("td", { className: `rp-${Math.abs(d) < 0.5 * 10 ** -dd ? "neutre" : d * sens > 0 ? "plus" : "moins"}` }, h("strong", null, fmt(c))));
                }))),
              imp.groupes.length > 0 && h("div", { className: "rp-gagnants" },
                h("h4", null, "Qui y gagne, qui y perd"),
                h("div", { className: "rp-gagnants__barres" }, imp.groupes.map((g) => h("div", { key: g.id, className: "rp-gagnant" },
                  h("span", null, GROUPES[g.id].court),
                  h("span", { className: "rp-gagnant__axe" }, h("i", { className: g.d > 0 ? "rp-plus" : "rp-moins", style: { width: `${Math.min(50, Math.abs(g.d) * 5)}%`, [g.d > 0 ? "left" : "right"]: "50%" } })),
                  h("b", { className: g.d > 0 ? "rp-plus" : "rp-moins" }, signe(g.d, 0))))),
                h("p", { className: "rp-discret" }, "Écart de satisfaction sur 100, dans un an.")),
              h("h4", { className: "rp-sous-titre" }, "Effets programmés"),
              h("ul", { className: "rp-programme" }, programme.map((ef, i) => h("li", { key: i }, h("span", null, M.effetTexte(ef)), h("small", null, M.effetDelai(ef))))),
              h(M.ReactionGouvernement, { partie, loi }))),
    pret && h(Section, { num: "§ 3", titre: decret ? "Adoption" : "À l'Assemblée", className: "rp-dossier__section" },
      decret
        ? h("p", null, M.pleinsPouvoirs(partie) ? "L'Assemblée est suspendue : le projet sera promulgué par décret dès votre signature. Le Pays jugera sur les résultats." : `${M.regimes[partie.regime.id]?.chambre || "La chambre"} : plus de vote, le projet est adopté d'office.`)
        : h(Fragment, null,
            h("div", { className: "rp-dossier__vote" },
              h(Hemicycle, { segments: segmentsPrevision(imp.ap.positions), camp: partie.camp, taille: 300, centre: [`${nb(imp.ap.voixAttendues, 0)}`, `voix attendues · ${imp.ap.seuil} requises`] }),
              h("div", { className: "rp-proba" },
                h("small", null, "Chances d'adoption"),
                h("strong", { className: imp.ap.probabilite >= 0.6 ? "rp-plus" : imp.ap.probabilite < 0.4 ? "rp-moins" : "" }, M.pct(imp.ap.probabilite, 0)),
                h("span", null, imp.ap.probabilite >= 0.6 ? "Majorité probable" : imp.ap.probabilite >= 0.4 ? "Vote serré : négociez en séance" : "Majorité difficile : prévoyez des concessions"))),
            h(M.NoteCohabitation, { matignon: imp.ap.matignon, partie }),
            h("div", { className: "rp-partis" }, imp.ap.positions.map((pos) => h(LigneParti, { key: pos.parti, pos, partie }))))));
}

function Comparateur({ partie, ids, onFermer, onDossier, onEtude, onRetirer }) {
  const donnees = useMemo(() => ids.map((id) => {
    const loi = M.lois[id], st = M.statutLoi(partie, loi), pret = !st.adoptee && (!M.etudeRequise(partie) || st.etude?.etat === "prete");
    return { loi, st, pret, etat: etatDossier(partie, loi), f: fiche(loi), ori: orientation(loi), imp: pret ? rapportImpact(partie, loi) : null };
  }), [ids, partie]);
  const meilleur = (fn) => { const v = donnees.map(fn); const m = Math.max(...v.filter((x) => x != null)); return v.map((x) => x != null && x === m && v.filter((y) => y === m).length < v.length); };
  const mBudget = meilleur((d) => d.loi.impactAnnuel || 0);
  const mProba = meilleur((d) => (d.imp ? d.imp.ap.probabilite : null));
  const mCout = meilleur((d) => -d.loi.coutPAP);
  const mSoutien = meilleur((d) => d.f.pourSieges);
  const lignes = [
    ["État", (d) => h(Tampon, { ton: d.etat.ton, petit: true }, d.etat.lib)],
    ["Ministère", (d) => minCourt(d.loi.ministere)],
    ["Dépôt", (d, i) => h("span", { className: mCout[i] ? "rp-meilleur" : "" }, h(Jetons, { n: d.loi.coutPAP, max: d.loi.coutPAP, petit: true }), ` ${d.loi.coutPAP} pt`)],
    ["Budget de l'État", (d, i) => h("span", { className: mBudget[i] ? "rp-meilleur" : "" }, h(BadgeBudget, { loi: d.loi }))],
    ["Ce que ça change", (d) => d.f.macro.join(" · ") || "—"],
    ["Groupes visés", (d) => h(Fragment, null, h(ListeGroupes, { ids: d.f.gagnants, ton: "bon" }), " ", h(ListeGroupes, { ids: d.f.perdants, ton: "mauvais" }), !d.f.gagnants.length && !d.f.perdants.length ? (d.f.tous > 0 ? "▲ tout le monde" : d.f.tous < 0 ? "▼ tout le monde" : "—") : null)],
    ["Accueil politique", (d, i) => h("span", { className: cx("rp-comp-spectre", mSoutien[i] && "rp-meilleur") }, h(Spectre, { loi: d.loi }), h("small", null, d.ori.fav.length ? `Pour : ${d.ori.fav.join(", ")}` : "Accueil partagé"))],
    ["Dans un an (étude)", (d) => (d.imp ? h(DeltaJauges, { jauges: d.imp.jauges }) : h("span", { className: "rp-discret" }, d.st.etude ? `Rapport ${M.libTour(d.st.etude.prete)}` : "Étude non commandée"))],
    ["Chances au vote", (d, i) => (d.imp ? h("strong", { className: mProba[i] ? "rp-meilleur" : "" }, M.decrets(partie) ? "adoptée d'office" : `${M.pct(d.imp.ap.probabilite, 0)} · ${nb(d.imp.ap.voixAttendues, 0)} voix`) : h("span", { className: "rp-discret" }, "après l'étude"))],
  ];
  return h(Panneau, { titre: "Comparer les projets", surtitre: `${ids.length} projets côte à côte`, onFermer, large: true, className: "rp-comparateur" },
    h("div", { className: "rp-comp", style: { "--n": ids.length } },
      h("div", { className: "rp-comp__rang rp-comp__rang--tete" }, h("span", null), donnees.map((d) => h("div", { key: d.loi.id, className: "rp-comp__titre", style: { "--rp-min": minCouleur(d.loi.ministere) } },
        h("strong", null, d.loi.titre),
        h("button", { type: "button", className: "rp-lien", onClick: () => onRetirer(d.loi.id) }, "retirer")))),
      lignes.map(([lib, fn]) => h("div", { key: lib, className: "rp-comp__rang" }, h("span", { className: "rp-comp__lib" }, lib), donnees.map((d, i) => h("div", { key: d.loi.id, className: "rp-comp__cell", "data-lib": lib }, fn(d, i))))),
      h("div", { className: "rp-comp__rang rp-comp__rang--actions" }, h("span", null), donnees.map((d) => {
        const ok = M.peutEtudier(partie, d.loi.id);
        return h("div", { key: d.loi.id, className: "rp-comp__cell" },
          !d.pret && !d.st.etude && !d.st.adoptee && h(Bouton, { taille: "petit", disabled: !ok.ok, onClick: () => onEtude(d.loi.id) }, ok.ok ? "Commander l'étude" : ok.raison || "Indisponible"),
          h(Bouton, { taille: "petit", variante: "ligne", onClick: () => onDossier(d.loi.id) }, "Ouvrir le dossier"));
      }))),
    h("p", { className: "rp-discret" }, "Surligné : la meilleure valeur de la ligne. Les effets à un an et les chances au vote n'apparaissent qu'avec le rapport d'impact."));
}
