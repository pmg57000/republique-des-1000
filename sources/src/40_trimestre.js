/* ---------- Écran Trimestre : bilan mis en scène, décisions, ordre du jour ---------- */
const RUBRIQUES = [
  ["parlement", "Au Parlement", ["vote", "politique", "matignon", "election", "regime", "pleinsPouvoirs", "institution"]],
  ["pays", "Dans le pays", ["evenement", "social", "statut", "defi", "plan", "fin"]],
  ["marches", "Marchés et finances", ["marches", "notation", "ue", "crise"]],
  ["dossiers", "Vos dossiers", ["etude"]],
];
const rubriqueDe = (type) => (RUBRIQUES.find(([, , t]) => t.includes(type)) || ["autres"])[0];
const tonEntree = (e) => (e.loiRejetee || e.defiRate || e.pmRejete || e.notation === -1 || /censure adoptée|rejet|dégrad|manqu|grève|émeute|crise/i.test(e.texte) ? "mauvais"
  : e.loiId || e.defiReussi || e.pm || e.notation === 1 || /adoptée|réussi|investi|relèvent/i.test(e.texte) ? "bon" : "neutre");

function Journal({ entrees, compact }) {
  const groupes = RUBRIQUES.map(([id, lib]) => [id, lib, entrees.filter((e) => rubriqueDe(e.type) === id)]).filter(([, , l]) => l.length);
  const autres = entrees.filter((e) => rubriqueDe(e.type) === "autres");
  if (!entrees.length) return h(Vide, null, "Un trimestre calme : rien à signaler.");
  return h("div", { className: cx("rp-journal", compact && "rp-journal--compact") },
    groupes.map(([id, lib, l]) => h("div", { key: id, className: "rp-journal__rubrique" },
      h("h4", null, lib),
      h("ul", null, l.map((e, i) => h("li", { key: i, className: `rp-journal__ligne rp-journal__ligne--${tonEntree(e)}` }, h(Glose, null, e.texte)))))),
    autres.length > 0 && h("div", { className: "rp-journal__rubrique" }, h("h4", null, "Divers"),
      h("ul", null, autres.map((e, i) => h("li", { key: i, className: "rp-journal__ligne" }, h(Glose, null, e.texte))))));
}

function AvantApres({ avant, apres }) {
  const lignes = JAUGES.map(([cle, lib]) => ({ lib, a: avant.jauges[cle], b: apres.jauges[cle] }))
    .concat([{ lib: "Popularité", a: avant.popularite * 100, b: apres.popularite * 100, pct: true }]);
  return h("div", { className: "rp-avantapres" }, lignes.map((l) => {
    const d = l.b - l.a;
    return h("div", { key: l.lib, className: "rp-avantapres__ligne" },
      h("span", { className: "rp-avantapres__lib" }, l.lib),
      h("span", { className: "rp-avantapres__barre", "aria-hidden": true },
        h("i", { className: "rp-avantapres__avant", style: { width: `${Math.max(0, Math.min(100, l.a))}%` } }),
        h("i", { className: cx("rp-avantapres__apres", d >= 0 ? "rp-plus" : "rp-moins"), style: { width: `${Math.max(0, Math.min(100, l.b))}%` } })),
      h("span", { className: "rp-avantapres__val" }, nb(l.b, 0), l.pct ? " %" : ""),
      h("span", { className: cx("rp-avantapres__delta", `rp-${ton(d) === "bon" ? "plus" : ton(d) === "mauvais" ? "moins" : "neutre"}`) }, `${fleche(d)} ${nb(Math.abs(d), 0)}`));
  }));
}

function Chiffres({ avant, apres }) {
  return h("table", { className: "rp-chiffres" },
    h("thead", null, h("tr", null, h("th", null, ""), h("th", null, "Avant"), h("th", null, "Après"), h("th", null, "Écart"))),
    h("tbody", null, M.figures.map((f) => {
      const a = f.d(avant[f.cle]), b = f.d(apres[f.cle]), d = b - a, eps = 0.5 * 10 ** -(f.dd ?? 1);
      return h("tr", { key: f.cle },
        h("th", null, f.lib),
        h("td", null, f.f(avant[f.cle])),
        h("td", null, h("strong", null, f.f(apres[f.cle]))),
        h("td", { className: `rp-${Math.abs(d) < eps ? "neutre" : d * f.sens > 0 ? "plus" : "moins"}` }, Math.abs(d) < eps ? "=" : `${d > 0 ? "+" : "−"}${nb(Math.abs(d), f.dd ?? 1)}${f.suffixe || ""}`));
    })));
}

function EnTeteUne({ une, libelle, onLire, ouverture }) {
  return h("header", { className: "rp-une-tete" },
    h("div", { className: "rp-une-tete__bandeau" },
      h("span", null, "Le Quotidien de la République"),
      h("span", null, une ? `n° ${une.numero} · ${une.date}` : libelle)),
    h(Surtitre, null, ouverture ? "Prise de fonctions" : `Bilan · ${libelle}`),
    h("h2", { className: "rp-une-tete__titre" }, une?.titre || libelle),
    une?.article?.[0] && h("p", { className: "rp-une-tete__chapo" }, une.article[0]),
    une && h(Bouton, { variante: "ligne", onClick: onLire }, "Lire la Une complète"));
}

function BlocElection({ partie, election: el }) {
  if (el.type === "legislatives" && el.sieges) {
    const allies = ORDRE_PARTIS.filter((id) => id !== partie.camp && M.allie(partie.camp, id));
    const bloc = (el.sieges[partie.camp] || 0) + allies.reduce((a, id) => a + (el.sieges[id] || 0), 0);
    return h("div", { className: "rp-election rp-election--legislatives" },
      h("div", null,
        h(Surtitre, null, el.ouverture ? "Législatives d'investiture" : "Législatives de mi-mandat"),
        h("strong", null, `Votre camp : ${el.sieges[partie.camp]} sièges (${el.variation >= 0 ? "+" : "−"}${Math.abs(el.variation ?? 0)})`),
        h("p", null, `Avec vos alliés naturels : ${bloc} sur 100. Le gouvernement a démissionné : un Premier ministre doit obtenir la confiance.`),
        h("ul", { className: "rp-election__partis" }, ORDRE_PARTIS.map((id) => {
          const d = (el.sieges[id] || 0) - (el.avant?.[id] ?? el.sieges[id] ?? 0);
          return h("li", { key: id }, h("span", { className: "rp-parti__puce", style: { background: PARTIS[id].couleur } }), PARTIS[id].court, h("b", null, el.sieges[id]), d !== 0 && h("small", { className: d > 0 ? "rp-plus" : "rp-moins" }, `${d > 0 ? "+" : "−"}${Math.abs(d)}`));
        }))),
      h(Hemicycle, { segments: segmentsComposition(el.sieges), camp: partie.camp, taille: 260, anime: true }));
  }
  return h("div", { className: cx("rp-election", el.gagnee ? "rp-election--gagnee" : "rp-election--perdue") },
    h(Surtitre, null, `Élection présidentielle${el.annee ? ` ${el.annee}` : ""}`),
    h("strong", null, el.gagnee ? "Réélu" : "Battu"), ` avec ${M.pct(el.popularite ?? 0, 0)} de citoyens satisfaits.`);
}

function BilanTrimestre({ partie, onLireUne, onDossier }) {
  const r = partie.rapport;
  if (!r) return null;
  const av = r.precedent, ap = r.actuel;
  if (r.ouverture) {
    const info = M.info(partie);
    return h("article", { className: "rp-bilan rp-bilan--ouverture" },
      h(EnTeteUne, { une: r.une, libelle: r.libelle, onLire: onLireUne, ouverture: true }),
      h("div", { className: "rp-bilan__grille" },
        h(Section, { titre: "La situation", className: "rp-carte" },
          h("ul", { className: "rp-puces" },
            h("li", null, `${M.argent(info.dette)} de dette, ${M.argent(info.deficit)} de déficit par an : chaque année, l'État dépense plus qu'il ne gagne.`),
            h("li", null, `${nb(info.chomeurs, 0)} chômeurs sur 1 000 citoyens, croissance ${nb(info.croissanceGA * 100, 1)} % sur un an.`),
            h("li", null, `Les prêteurs exigent ${nb(info.taux, 2)} % pour prêter au Pays. `, h(BoutonFiche, { id: "note", className: "rp-boutonfiche--texte", titre: "Note du pays : explications" }, `Note ${info.notation?.note}`), "."))),
        h(Section, { titre: "Les règles du mandat", className: "rp-carte" },
          h("ul", { className: "rp-puces" },
            h("li", null, "Chaque trimestre, ", h("strong", null, `${partie.regles.papParTrimestre} points d'action`), " pour déposer des projets. Ils ne se reportent pas."),
            M.etudeRequise(partie) && h("li", null, "Un projet ne se vote qu'après son ", h("strong", null, "étude d'impact"), ` : ${M.limitesEtudes.max} à la fois, rapport au trimestre suivant.`),
            h("li", null, "Il faut ", h("strong", null, "51 voix sur 100"), ". Aucun groupe n'a la majorité."),
            h("li", null, "Satisfaction sous 25 ou un groupe radicalisé à 90 : grève générale, puis émeutes. Si les prêteurs exigent des intérêts trop lourds : crise de financement, puis tutelle du ", h(Terme, { id: "mes" }, "MES"), "."),
            h("li", null, "Élection après 20 trimestres : il faut ", h("strong", null, "50 % de citoyens satisfaits"), ".")))),
      h("div", { className: "rp-bilan__duo" }, h(M.Defi, { partie }), h(M.Echeances, { partie })));
  }
  const vus = r.journal || [];
  const votes = vus.filter((e) => e.type === "vote" && (e.loiId || e.loiRejetee));
  return h("article", { className: "rp-bilan" },
    h(EnTeteUne, { une: r.une, libelle: r.libelle, onLire: onLireUne }),
    r.election && h(BlocElection, { partie, election: r.election }),
    votes.length > 0 && h("div", { className: "rp-bilan__votes" },
      votes.map((e, i) => h("button", { key: i, type: "button", className: cx("rp-vote-carte", e.loiId ? "rp-vote-carte--oui" : "rp-vote-carte--non"), onClick: () => onDossier(e.loiId || e.loiRejetee) },
        h(Tampon, { ton: e.loiId ? "vert" : "rouge", petit: true }, e.loiId ? (e.mode === "493" ? "49.3" : e.mode === "decret" ? "Décret" : "Adoptée") : "Rejetée"),
        h("strong", null, M.lois[e.loiId || e.loiRejetee]?.titre),
        h("span", null, e.loiId ? (e.pour ? `${e.pour} pour · ${e.contre} contre` : "sans vote") : `${e.pour} pour · il en fallait ${e.seuil}`)))),
    h("div", { className: "rp-bilan__grille" },
      h(Section, { titre: "Ce qui a changé", droite: h("span", { className: "rp-discret" }, `pendant le ${M.libTour(r.tour - 1)}`), className: "rp-carte" },
        h(AvantApres, { avant: av, apres: ap })),
      h(Section, { titre: "Les chiffres", className: "rp-carte" }, h(Chiffres, { avant: av, apres: ap }))),
    h(Section, { titre: "Ce qui s'est passé", className: "rp-carte" }, h(Journal, { entrees: vus })),
    r.differes?.length > 0 && h(Section, { titre: "Effets différés de vos lois", className: "rp-carte" },
      h("ul", { className: "rp-differes" }, r.differes.map((d) => h("li", { key: d.loiId },
        h("button", { type: "button", className: "rp-lien", onClick: () => onDossier(d.loiId) }, d.titre),
        h("span", null, d.effets.map((ef) => M.effetTexte(ef)).join(" · ")))))));
}

/* Décisions qui bloquent l'ouverture de la session */
function Decisions({ partie, agir, onAssemblee }) {
  const evts = partie.evenements.courants.map((ev, i) => [ev, i]);
  const aTrancher = evts.filter(([ev]) => ev.choix && !ev.resolu);
  const faits = partie.phase === "bilan" ? evts.filter(([ev]) => !(ev.choix && !ev.resolu)) : [];
  const mes = partie.crise && !partie.crise.refusee;
  const pm = M.pmRequis(partie);
  if (!pm && !mes && !aTrancher.length && !faits.length && !partie.crisePolitique) return null;
  return h("section", { className: "rp-decisions", id: "decisions", "aria-label": "Décisions" },
    (pm || mes || aTrancher.length > 0 || partie.crisePolitique) && h("header", { className: "rp-decisions__tete" },
      h(Tampon, { ton: "rouge" }, "Décision requise"),
      h("p", null, "La session ne s'ouvre qu'une fois ces points tranchés.")),
    partie.crisePolitique && h("div", { className: "rp-decision rp-decision--urgente" },
      h("h3", null, "Votre gouvernement est renversé"),
      h("p", null, "La motion de censure est adoptée. Rendez-vous à l'Assemblée pour dissoudre ou démissionner."),
      h(Bouton, { variante: "rouge", onClick: onAssemblee }, "Aller à l'Assemblée")),
    pm && h("div", { className: "rp-decision rp-decision--pm" }, h(M.NominationPM, { partie, agir })),
    mes && h("div", { className: "rp-decision rp-decision--urgente" },
      h(Surtitre, null, "Crise de financement"),
      h("h3", null, "Le ", h(Terme, { id: "mes" }, "MES"), " propose un prêt d'urgence"),
      h("p", null, `Les prêteurs exigent des intérêts énormes : la dette coûte déjà ${M.argent(partie.macro.depenses?.interets || 0)} par an et plus personne ne veut prêter au pays.`),
      h("p", { className: "rp-discret" }, "Accepter : budget sous tutelle deux ans (coupes, pensions gelées, TVA rétablie). Refuser : si les intérêts restent aussi lourds au prochain trimestre, c'est la faillite et la fin du mandat."),
      h("div", { className: "rp-decision__choix" },
        h(Bouton, { variante: "ligne", onClick: () => agir((p) => M.decisionMES(p, false)) }, "Refuser"),
        h(Bouton, { onClick: () => agir((p) => M.decisionMES(p, true)) }, "Accepter le programme"))),
    aTrancher.map(([ev, i]) => h("div", { key: ev.id + i, className: cx("rp-decision", ev.special === "bascule" && "rp-decision--urgente") },
      h(Surtitre, null, ev.special === "bascule" ? "Bascule de régime" : M.categoriesEvt[ev.categorie] || "Événement"),
      h("h3", null, ev.titre),
      h("p", null, h(Glose, null, ev.texte)),
      ev.special === "bascule" && h(M.RegimeResume, { regime: ev.regime }),
      h("div", { className: cx("rp-decision__choix", ev.choix.length > 2 && "rp-decision__choix--liste") },
        ev.choix.map((c, k) => h("button", { key: k, type: "button", className: "rp-choix", onClick: () => agir((p) => M.choixEvenement(p, i, k)) },
          h("strong", null, c.libelle), c.texte && h("span", null, c.texte)))))),
    faits.length > 0 && h("div", { className: "rp-evenements" },
      faits.map(([ev, i]) => h("div", { key: ev.id + i, className: "rp-evenement" },
        h(Surtitre, null, M.categoriesEvt[ev.categorie] || "Événement"),
        h("strong", null, ev.titre),
        h("p", null, h(Glose, null, ev.texte)),
        ev.choix && ev.resolu && h("p", { className: "rp-discret" }, "Votre choix : ", ev.choix[ev.choixFait]?.libelle),
        !ev.choix && ev.effets && h("p", { className: "rp-discret" }, ev.effets.slice(0, 3).map((ef) => M.effetTexte(ef)).join(" · "))))));
}

function NoteMatignon({ partie, onDossier }) {
  const note = useMemo(() => { try { return M.noteMatignon(partie); } catch { return null; } }, [partie]);
  if (!note) return null;
  return h("aside", { className: "rp-note" },
    h("div", { className: "rp-note__tete" },
      h(Surtitre, null, "Note de Matignon · confidentiel"),
      h("span", null, note.nomProfil)),
    h("h3", null, note.priorite?.titre),
    h("p", null, h(Glose, null, note.priorite?.texte)),
    h("ul", { className: "rp-note__constats" }, (note.constats || []).map((c) => h("li", { key: c.lib, className: c.alerte ? "rp-alerte" : "" }, h("span", null, c.lib), h("strong", null, c.valeur)))),
    note.suggestion && h("button", { type: "button", className: "rp-note__suggestion", onClick: () => onDossier(note.suggestion.loiId) },
      h("span", null, "Matignon suggère"),
      h("strong", null, note.suggestion.titre),
      h("small", null, `≈ ${note.suggestion.voix} voix attendues · ${note.suggestion.coutPAP} point${note.suggestion.coutPAP > 1 ? "s" : ""}`)));
}

function itemsOrdreDuJour(p) {
  const items = [];
  const prets = M.rapportsPrets(p), cours = M.etudesEnCours(p), max = M.limitesEtudes.max;
  if (p.vote) {
    const l = M.lois[p.vote.loiId];
    items.push({ cle: "vote", ton: "rouge", icone: "🏛️", tampon: p.vote.statut === "debat" ? "En séance" : "Résultat", titre: l.titre, texte: p.vote.statut === "debat" ? "Le projet attend le vote : négociez, amendez, puis votez." : "Le résultat est tombé.", action: { lib: "Aller en séance", onglet: "assemblee" } });
  }
  for (const id of prets) {
    const l = M.lois[id], st = M.statutLoi(p, l);
    items.push({ cle: id, ton: "vert", icone: "📗", tampon: "Rapport prêt", titre: l.titre, texte: st.disponible ? `Prêt pour le vote : ${l.coutPAP} pièce${l.coutPAP > 1 ? "s" : ""}.` : raison(st.raisons[0]), action: { lib: "Lire le rapport", dossier: id } });
  }
  for (const pr of p.politique.promesses || []) {
    const reste = pr.echeance - p.tour;
    items.push({ cle: `pr-${pr.loiId}`, ton: reste <= 1 ? "rouge" : "gris", icone: "🤝", tampon: `Promesse · ${M.libTour(pr.echeance)}`, titre: M.lois[pr.loiId].titre, texte: `Promis à ${PARTIS[pr.parti].court}. Non tenue, la promesse retourne le groupe contre vous.`, action: { lib: "Ouvrir", dossier: pr.loiId } });
  }
  for (const pa of pactesDe(p)) {
    const echeance = pa.reste <= 0 ? "ce trimestre" : `${pa.reste} trim.`;
    items.push({ cle: `pacte-${pa.id}`, ton: pa.reste <= 1 ? "rouge" : "gris", icone: "✍️", tampon: `Pacte · ${echeance}`, titre: `Pacte « ${pa.nom} »`,
      texte: `${pa.texte} Promis à ${(pa.cibles || []).map((c) => PARTIS[c]?.court).filter(Boolean).join(" et ")} lors de l'investiture.`,
      action: pa.type === "loi" ? { lib: "Trouver la loi", onglet: "reformes" } : null, enCours: pa.type !== "loi" || pa.reste > 1 });
  }
  for (const id of cours) {
    const et = M.etude(p, id);
    items.push({ cle: `c-${id}`, ton: "ambre", icone: "⏳", tampon: `Rapport ${M.libTour(et.prete)}`, titre: M.lois[id].titre, texte: "Les experts y travaillent. Rapport au prochain trimestre.", action: { lib: "Voir", dossier: id }, enCours: true });
  }
  if (M.etudeRequise(p) && cours.length < max && !p.fin) {
    const libres = max - cours.length;
    items.push({ cle: "etude", ton: "bleu", icone: "🔍", tampon: `${libres} emplacement${libres > 1 ? "s" : ""} libre${libres > 1 ? "s" : ""}`, titre: "Commander une étude d'impact", texte: "Gratuit. Préparez les votes du trimestre prochain en comparant les projets.", action: { lib: "Choisir des réformes", onglet: "reformes" } });
  }
  return items;
}

function missionsAccomplies(p) {
  const faits = [];
  p.journal.filter((e) => e.tour === p.tour).forEach((e, k) => {
    if (e.type === "vote" && e.loiId) faits.push({ cle: `v${k}`, icone: "🎉", titre: `Loi adoptée : ${M.lois[e.loiId].titre}` });
    if (e.type === "vote" && e.loiRejetee) faits.push({ cle: `r${k}`, icone: "📉", titre: `Rejetée : ${M.lois[e.loiRejetee].titre}`, rate: true });
    if (e.type === "matignon" && e.pm) faits.push({ cle: `m${k}`, icone: "🎩", titre: "Premier ministre investi" });
    const pacte = e.type === "politique" && /^« (.+) » (tenu|rompu)/.exec(e.texte || "");
    if (pacte) faits.push({ cle: `p${k}`, icone: pacte[2] === "tenu" ? "🤝" : "💔", titre: `Pacte ${pacte[2]} : « ${pacte[1]} »`, rate: pacte[2] === "rompu" });
  });
  Object.entries(p.lois.etudes || {}).filter(([, et]) => et.commande === p.tour).forEach(([id]) => faits.push({ cle: `e${id}`, icone: "📋", titre: `Étude commandée : ${M.lois[id].titre}` }));
  return faits;
}

function OrdreDuJour({ partie, onDossier, setOnglet }) {
  const items = itemsOrdreDuJour(partie);
  const faits = missionsAccomplies(partie);
  const aFaire = items.filter((it) => !it.enCours);
  const total = faits.filter((f) => !f.rate).length + aFaire.length;
  const progres = total ? (faits.filter((f) => !f.rate).length / total) * 100 : 100;
  const premier = partie.tour === 1 || (M.rapportsPrets(partie).length === 0 && !partie.vote);
  return h("section", { className: "rp-odj", "aria-label": "Missions du trimestre" },
    h("header", { className: "rp-odj__tete" },
      h(Surtitre, null, `Session parlementaire · ${M.libTour(partie.tour)}`),
      h("h2", null, "Missions du trimestre"),
      h("div", { className: "rp-odj__progres" },
        h("span", { className: "rp-odj__barre", "aria-hidden": true }, h("i", { style: { width: `${progres}%` } })),
        h("b", null, `${faits.filter((f) => !f.rate).length}/${total}`)),
      h("p", null, partie.pap > 0
        ? h(Fragment, null, h(Jetons, { n: partie.pap, max: partie.regles.papParTrimestre, petit: true }), ` Encore ${partie.pap} pièce${partie.pap > 1 ? "s" : ""} d'action à dépenser : elles disparaissent à la fin du trimestre.`)
        : "Toutes vos pièces sont dépensées. Vous pouvez clore le trimestre.")),
    premier && partie.pap > 0 && M.etudeRequise(partie) && h("p", { className: "rp-odj__aide" },
      h("strong", null, "Aucun rapport prêt ce trimestre."), " Un projet ne se vote qu'après son étude d'impact : commandez-en jusqu'à deux maintenant, vous pourrez les soumettre au vote dès le trimestre suivant."),
    h("ol", { className: "rp-odj__liste" },
      items.map((it, k) => h("li", { key: it.cle, className: `rp-odj__item rp-odj__item--${it.ton}`, style: { "--i": k } },
        h("span", { className: "rp-odj__icone", "aria-hidden": true }, it.icone),
        h(Tampon, { ton: it.ton, petit: true }, it.tampon),
        h("div", { className: "rp-odj__texte" }, h("strong", null, it.titre), h("span", null, it.texte)),
        it.action ? h(Bouton, { variante: it.ton === "vert" || it.ton === "rouge" ? "plein" : "ligne", taille: "petit", onClick: () => (it.action.dossier ? onDossier(it.action.dossier) : setOnglet(it.action.onglet)) }, it.action.lib) : h("span", { className: "rp-odj__rappel" }, "À tenir"))),
      faits.map((f) => h("li", { key: f.cle, className: cx("rp-odj__item rp-odj__item--fait", f.rate && "rp-odj__item--rate") },
        h("span", { className: "rp-odj__icone", "aria-hidden": true }, f.icone),
        h("span", { className: "rp-odj__coche", "aria-hidden": true }, f.rate ? "✗" : "✓"),
        h("div", { className: "rp-odj__texte" }, h("strong", null, f.titre))))));
}

function EcranTrimestre({ partie, agir, info, etape, onAction, onDossier, onLireUne, setOnglet }) {
  const [revoir, setRevoir] = useState(false);
  useEffect(() => setRevoir(false), [partie.tour]);
  const enBilan = partie.phase === "bilan";
  return h("div", { className: "rp-page rp-trimestre" },
    h("div", { className: "rp-trimestre__principal" },
      h(Decisions, { partie, agir, onAssemblee: () => setOnglet("assemblee") }),
      enBilan
        ? h(Fragment, null,
            h(BilanTrimestre, { partie, onLireUne, onDossier }),
            !decisionsEnAttente(partie).length && h("div", { className: "rp-trimestre__suite" },
              h("p", null, "Bilan lu ? Ouvrez la session : études, dépôts et votes du trimestre."),
              h(Bouton, { taille: "grand", onClick: () => onAction("ouvrir") }, "Ouvrir la session")))
        : h(Fragment, null,
            h(OrdreDuJour, { partie, onDossier, setOnglet }),
            h("div", { className: "rp-trimestre__revoir" },
              h(Bouton, { variante: "ligne", onClick: () => setRevoir(!revoir), "aria-expanded": revoir }, revoir ? "Masquer le bilan du trimestre" : `Relire le bilan ${M.libTour(partie.tour)}`)),
            revoir && h(BilanTrimestre, { partie, onLireUne, onDossier }))),
    h("aside", { className: "rp-trimestre__cote" },
      h(TableauDeBord, { partie, info, vertical: true }),
      !enBilan && h(NoteMatignon, { partie, onDossier }),
      !partie.rapport?.ouverture && h(M.Defi, { partie }),
      !partie.rapport?.ouverture && h(M.Echeances, { partie })));
}
