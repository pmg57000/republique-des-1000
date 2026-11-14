/* ---------- Assemblée : l'hémicycle, la séance, le dépouillement ---------- */
const DEJA_DEPOUILLE = new Set();
function useCompteur(cible, actif, duree = 1400) {
  const [v, setV] = useState(actif ? 0 : cible);
  useEffect(() => {
    if (!actif) { setV(cible); return; }
    let raf, t0;
    const pas = (t) => { t0 ??= t; const k = Math.min(1, (t - t0) / duree); setV(Math.round(cible * (1 - (1 - k) ** 3))); if (k < 1) raf = requestAnimationFrame(pas); };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [cible, actif]);
  return v;
}

function registreScrutins(p) {
  return p.journal.filter((e) => (e.type === "vote" && (e.loiId || e.loiRejetee)) || (e.type === "matignon" && (e.pm || e.pmRejete))).map((e) => ({
    tour: e.tour,
    loiId: e.loiId || e.loiRejetee || null,
    titre: e.loiId || e.loiRejetee ? M.lois[e.loiId || e.loiRejetee]?.titre : e.texte.split(" investi")[0].split(" rejeté")[0],
    objet: e.loiId || e.loiRejetee ? "Projet de loi" : "Confiance au Premier ministre",
    issue: e.loiRejetee || e.pmRejete ? "rejetee" : e.mode === "493" ? "493" : e.mode === "decret" ? "decret" : "adoptee",
    detail: e.loiId ? (e.pour ? `${e.pour} pour · ${e.contre} contre` : e.mode === "493" ? "sans vote (49.3)" : "sans vote") : e.loiRejetee ? `${e.pour} pour · ${e.seuil} requises` : e.texte,
  })).reverse();
}
const ISSUE = { adoptee: ["Adoptée", "vert"], "493": ["49.3", "ambre"], decret: ["Décret", "bleu"], rejetee: ["Rejetée", "rouge"] };

function Registre({ partie, max, onDossier }) {
  const l = registreScrutins(partie).slice(0, max || 999);
  if (!l.length) return h(Vide, null, "Aucun scrutin pour l'instant. Les votes de l'Assemblée s'inscriront ici.");
  return h("ol", { className: "rp-registre" }, l.map((s, i) => h("li", { key: i, className: "rp-registre__ligne" },
    h("span", { className: "rp-registre__tour" }, M.libTour(s.tour)),
    h(Tampon, { ton: ISSUE[s.issue][1], petit: true }, ISSUE[s.issue][0]),
    h("span", { className: "rp-registre__objet" },
      s.loiId ? h("button", { type: "button", className: "rp-lien", onClick: () => onDossier(s.loiId) }, s.titre) : h("strong", null, s.titre),
      h("small", null, `${s.objet} · ${s.detail}`)))));
}

function Negociation({ partie, partiId, onFermer, onChoisir }) {
  const info = M.infoNego(partie, partiId);
  const avant = M.etatVote(partie).probabilite;
  const apres = (choix) => M.etatVote(M.negocier(partie, partiId, choix)).probabilite;
  const pPromesse = info.promesse ? apres("promesse") : null, pConcession = apres("concession");
  return h(Panneau, { titre: info.parti.nom, surtitre: "Négociation en coulisses", onFermer, couleur: info.parti.couleur },
    h("p", { className: "rp-nego__etat" }, "Chances d'adoption aujourd'hui : ", h("strong", null, M.pct(avant, 0)), ". Une seule négociation par groupe et par projet."),
    h("div", { className: "rp-nego" },
      h("button", { type: "button", className: "rp-choix", disabled: !info.promesse, onClick: () => onChoisir("promesse") },
        h("span", { className: "rp-choix__tete" }, h("strong", null, "Promettre une loi"), pPromesse != null && h(Pastille, { ton: "bon" }, `→ ${M.pct(pPromesse, 0)}`)),
        h("span", null, info.promesse ? `Déposer « ${info.promesse.titre} » d'ici ${info.promesse.delai} trimestres. Promesse non tenue : le groupe vous tourne le dos.` : "Ce groupe ne réclame aucune loi du catalogue actuel.")),
      h("button", { type: "button", className: "rp-choix", onClick: () => onChoisir("concession") },
        h("span", { className: "rp-choix__tete" }, h("strong", null, "Concession budgétaire"), h(Pastille, { ton: "bon" }, `→ ${M.pct(pConcession, 0)}`)),
        h("span", null, `+${M.euros(info.concession.euros)} par an pour « ${(M.lignesBudget[info.concession.ligne] || info.concession.ligne).toLowerCase()} » pendant ${info.concession.duree} trimestres. Creuse le déficit d'autant.`))));
}

function Confirmation493({ partie, ev, onFermer, onConfirmer }) {
  return h(Panneau, { titre: "Engager le 49.3 ?", surtitre: "Article 49, alinéa 3", onFermer, couleur: "var(--rouge)",
    pied: h("div", { className: "rp-pied-actions" }, h(Bouton, { variante: "ligne", onClick: onFermer }, "Annuler"), h(Bouton, { variante: "rouge", onClick: onConfirmer, className: "rp-pied-actions__principal" }, "Passer en force")) },
    h("p", null, "La loi est adoptée sans vote. En échange :"),
    h("ul", { className: "rp-puces" },
      h("li", null, `Radicalisation de tous les groupes +${M.params.parlement.colere493} points, immédiatement.`),
      h("li", null, `Popularité −${nb(M.params.parlement.penalitePopularite493 * 100, 0)} points, qui s'estompent avec le temps.`),
      h("li", null, "L'opposition dépose une motion de censure. À 51 voix, le gouvernement tombe : dissolution ou démission.")),
    pactesDe(partie).filter((pa) => pa.type === "sans493").map((pa) => h("p", { key: pa.id, className: "rp-pacte-info rp-pacte-info--rompu" }, h("b", null, "⚠ Pacte rompu"), ` Vous avez promis « ${pa.nom} » : le 49.3 vous coûtera la confiance de ${(pa.cibles || []).map((c) => PARTIS[c]?.court).join(" et ")} et ${nb(M.pactesParams.penalitePop * 100, 0)} points de popularité.`)),
    h("div", { className: "rp-risque" },
      h("span", null, "Risque de censure"), h("strong", { className: ev.probabiliteCensure >= 0.35 ? "rp-moins" : "" }, M.pct(ev.probabiliteCensure, 0))),
    h("div", { className: "rp-partis" }, ev.positionsCensure.filter((p) => p.parti !== partie.camp).map((p) => h("div", { key: p.parti, className: "rp-parti" },
      h("span", { className: "rp-parti__puce", style: { background: PARTIS[p.parti].couleur } }),
      h("span", { className: "rp-parti__nom" }, PARTIS[p.parti].court, h("small", null, ` ${p.sieges} sièges`)),
      h("span", { className: "rp-parti__barre" }, h("i", { style: { width: `${p.prob * 100}%`, background: "var(--rouge)" } })),
      h(Pastille, { ton: p.prob >= 0.5 ? "mauvais" : "neutre" }, `${nb(p.prob * 100, 0)} % censure`)))),
    !ev.loi.loiDeFinances && h("p", { className: "rp-discret" }, "Hors loi de finances, le 49.3 n'est permis qu'une fois par session."));
}

function Seance({ partie, agir, onDossier }) {
  const ev = useMemo(() => M.etatVote(partie), [partie]);
  const props = useMemo(() => M.propositionsAmendement(partie), [partie]);
  const [choix, setChoix] = useState(null);
  const [nego, setNego] = useState(null);
  const [c493, setC493] = useState(false);
  const apercu = useMemo(() => (choix ? M.etatVote(M.amender(partie, choix)) : null), [partie, choix]);
  const vue = apercu || ev;
  const loi = ev.loi;
  const ok = vue.voixAttendues >= vue.seuil;
  return h("div", { className: "rp-seance" },
    h("div", { className: "rp-scene" },
      h("div", { className: "rp-scene__tete" },
        h(Surtitre, null, `Séance publique · ${M.libTour(partie.tour)} · ${ev.chambre}`),
        h("p", { className: "rp-scene__odj" }, "Ordre du jour"),
        h("h1", { className: "rp-scene__titre" }, loi.titre),
        h("button", { type: "button", className: "rp-lien rp-lien--clair", onClick: () => onDossier(loi.id) }, "Relire le rapport d'impact")),
      h("div", { className: "rp-scene__hemi" },
        h(Hemicycle, { segments: segmentsPrevision(vue.positions), camp: partie.camp, taille: 520, sombre: true, centre: [nb(vue.voixAttendues, 0), `voix attendues · ${vue.seuil} requises`] }),
        h("div", { className: "rp-scene__jauge" },
          h("div", { className: "rp-majorite" }, h("i", { style: { width: `${Math.min(100, vue.voixAttendues)}%` }, className: ok ? "rp-plus" : "rp-moins" }), h("b", { style: { left: `${vue.seuil}%` } })),
          h("p", null, h("strong", null, M.pct(vue.probabilite, 0)), " de chances d'adoption", apercu && h("em", null, ` (avec l'amendement, contre ${M.pct(ev.probabilite, 0)})`))),
        h("p", { className: "rp-scene__legende" }, "Disques pleins : voix « pour » attendues. Cercles : contre ou abstention."))),
    h("div", { className: "rp-seance__grille" },
      h(Section, { titre: "Les groupes", droite: h("span", { className: "rp-discret" }, "une négociation par groupe"), className: "rp-carte" },
        h("div", { className: "rp-partis" }, ev.positions.map((pos) => h(LigneParti, { key: pos.parti, pos, partie, negociation: partie.vote.negociations[pos.parti], onNegocier: setNego }))),
        ev.matignon?.type && ev.matignon.type !== "neutre" && h(M.NoteCohabitation, { matignon: ev.matignon, partie })),
      h("div", { className: "rp-seance__col" },
        (props.length > 0 || ev.amendements.length > 0) && h(Section, { titre: "Amendements", droite: h(Pastille, null, `${ev.amendements.length}/${ev.maxAmendements}`), className: "rp-carte" },
          ev.amendements.map((a, i) => h("p", { key: i, className: "rp-amendement rp-amendement--adopte" }, h(Tampon, { ton: "vert", petit: true }, "Adopté"), " ", a.titre)),
          props.map((a) => h("button", { key: a.type, type: "button", className: cx("rp-choix", choix === a.type && "rp-choix--actif"), onClick: () => setChoix(choix === a.type ? null : a.type), "aria-pressed": choix === a.type },
            h("span", { className: "rp-choix__tete" }, h("strong", null, a.titre), h(Pastille, { ton: "bon" }, `+${Math.round(a.gain)} voix`)),
            a.compromis && h("span", null, a.compromis))),
          choix && h(Bouton, { onClick: () => { agir((p) => M.amender(p, choix)); setChoix(null); } }, "Adopter cet amendement en séance")),
        h(Section, { titre: "Décision", className: "rp-carte rp-seance__decision", id: "rp-suite" },
          h(Bouton, { taille: "grand", onClick: () => { setChoix(null); agir(M.voter); } }, ev.automatique ? "Adopter" : ev.amendements.length ? "Voter le texte amendé" : "Passer au vote"),
          h("div", { className: "rp-seance__secondaires" },
            h(Bouton, { variante: "rouge-ligne", disabled: !ev.peut493, onClick: () => setC493(true) }, "Article 49.3"),
            h(Bouton, { variante: "ligne", onClick: () => agir(M.retirer) }, "Retirer le projet")),
          !ev.peut493 && ev.raison493 && h("p", { className: "rp-discret" }, `49.3 : ${ev.raison493.toLowerCase()}.`),
          (loi.horsConstitution || loi.ue) && h("p", { className: "rp-avertissement" }, loi.horsConstitution ? "Contraire à la Constitution : rien ne bloquera la loi, mais les marchés et la rue réagiront." : "Contraire au droit européen : Bruxelles sanctionnera.")))),
    nego && h(Negociation, { partie, partiId: nego, onFermer: () => setNego(null), onChoisir: (c) => { agir((p) => M.negocier(p, nego, c)); setNego(null); } }),
    c493 && h(Confirmation493, { partie, ev, onFermer: () => setC493(false), onConfirmer: () => { setC493(false); agir(M.art493); } }));
}

const SCEAU_STATUT = { adoptee: "adoptee", adoptee493: "adoptee493", rejetee: "rejetee", gouvernementCensure: "gouvernementCensure" };
function Depouillement({ partie, agir, onDossier, onClore }) {
  const v = partie.vote, loi = M.lois[v.loiId];
  const cle = `${partie.tour}-${v.loiId}-${v.statut}`;
  const [anime] = useState(() => !DEJA_DEPOUILLE.has(cle));
  useEffect(() => { DEJA_DEPOUILLE.add(cle); }, [cle]);
  const [sceau, setSceau] = useState(!anime);
  useEffect(() => { if (!anime) return; const t = setTimeout(() => setSceau(true), 1500); return () => clearTimeout(t); }, [anime]);
  const res = v.resultat, cens = v.censure;
  const pour = useCompteur(res ? res.pour : cens ? cens.voix : 0, anime);
  const sieges = partie.politique.sieges;
  const segs = cens ? segmentsResultat(cens.detail, sieges, "voix") : res ? segmentsResultat(res.detail, sieges, "pour") : segmentsComposition(sieges);
  const adoptee = v.statut === "adoptee" || v.statut === "adoptee493";
  const typeSceau = res?.automatique && v.statut === "adoptee" ? "decret" : SCEAU_STATUT[v.statut];
  return h("div", { className: "rp-seance" },
    h("div", { className: cx("rp-scene", "rp-scene--resultat", adoptee ? "rp-scene--oui" : "rp-scene--non") },
      h("div", { className: "rp-scene__tete" },
        h(Surtitre, null, cens ? "Motion de censure" : `Scrutin public · ${M.libTour(partie.tour)}`),
        h("p", { className: "rp-scene__odj" }, "Projet de loi"),
        h("h1", { className: "rp-scene__titre" }, loi.titre)),
      h("div", { className: "rp-scene__hemi" },
        h(Hemicycle, { segments: segs, camp: partie.camp, taille: 520, sombre: true, anime, cle, mise: cens ? "censure" : "vote", centre: [String(pour), cens ? "voix pour la censure · 51 requises" : res ? `voix pour · ${res.seuil} requises` : "adoptée sans vote"] }),
        h("div", { className: cx("rp-scene__sceau", sceau && "rp-scene__sceau--visible") }, typeSceau && sceau && h(M.Sceau, { type: typeSceau, taille: 132 }))),
      h("p", { className: cx("rp-scene__verdict", !sceau && "rp-scene__verdict--attente"), "aria-live": "polite" }, sceau ? (
        v.statut === "adoptee" ? (res?.automatique ? "Adoptée d'office." : `Adoptée par ${res.pour} voix contre ${res.contre}.`)
          : v.statut === "adoptee493" ? `Adoptée sans vote. La motion de censure échoue : ${cens?.voix ?? 0} voix sur 51.`
          : v.statut === "rejetee" ? `Rejetée : ${res.pour} voix pour, il en fallait ${res.seuil}.`
          : `Motion de censure adoptée par ${cens?.voix} voix : le gouvernement tombe.`) : "Dépouillement…")),
    h("div", { className: "rp-seance__grille" },
      (res || cens) && h(Section, { titre: cens ? "Vote de la censure par groupe" : "Le vote par groupe", className: "rp-carte" },
        h("table", { className: "rp-tableau-vote" },
          h("thead", null, h("tr", null, h("th", null, "Groupe"), h("th", null, cens ? "Censure" : "Pour"), !cens && h("th", null, "Contre"))),
          h("tbody", null, ORDRE_PARTIS.map((id) => {
            const d = (cens || res).detail.find((x) => x.parti === id);
            if (!d) return null;
            return h("tr", { key: id }, h("th", null, h("span", { className: "rp-parti__puce", style: { background: PARTIS[id].couleur } }), " ", PARTIS[id].court, id === partie.camp ? " (vous)" : ""),
              h("td", null, cens ? d.voix : d.pour), !cens && h("td", null, d.contre));
          }))),
        res?.matignon && h("p", { className: "rp-discret" }, `dont ${res.matignon.voix > 0 ? "+" : "−"}${Math.abs(res.matignon.voix)} voix de Matignon`)),
      h(Section, { titre: "Et maintenant ?", className: "rp-carte", id: "rp-suite" },
        partie.crisePolitique
          ? h(Fragment, null,
              h("p", null, partie.crisePolitique.dissolutionPossible
                ? `Vous pouvez dissoudre l'Assemblée et convoquer des législatives anticipées. Avec ${M.pct(partie.social.popularite, 0)} de popularité, votre camp risque gros.`
                : "Une dissolution a déjà eu lieu il y a moins d'un an : il ne reste que la démission."),
              h("div", { className: "rp-seance__secondaires" },
                partie.crisePolitique.dissolutionPossible && h(Bouton, { onClick: () => agir(M.dissolutionCensure) }, "Dissoudre l'Assemblée"),
                h(Bouton, { variante: "rouge", onClick: () => agir(M.demissionCensure) }, "Démissionner")))
          : h(Fragment, null,
              h("p", null, adoptee ? "La loi entre en vigueur. Ses effets apparaîtront dans le bilan du prochain trimestre." : "Le projet retourne dans vos dossiers. Son rapport reste valable : vous pourrez le redéposer dès le prochain trimestre, après avoir négocié."),
              h("div", { className: "rp-seance__secondaires" },
                partie.pap > 0 ? h(Bouton, { onClick: () => agir(M.continuer) }, `Continuer la session · ${partie.pap} pt`) : h(Bouton, { onClick: onClore }, "Clore le trimestre"),
                partie.pap === 0 && h(Bouton, { variante: "ligne", onClick: () => agir(M.continuer) }, "Revenir aux projets"),
                h(Bouton, { variante: "ligne", onClick: () => onDossier(loi.id) }, "Voir le dossier"))))));
}

function EcranAssemblee({ partie, agir, onDossier, onClore, setOnglet }) {
  const [groupe, setGroupe] = useState(null);
  const choisir = (id, ou) => setGroupe((g) => (g?.id === id && g.ou === ou ? null : { id, ou }));
  if (partie.vote) return partie.vote.statut === "debat" ? h(Seance, { partie, agir, onDossier }) : h(Depouillement, { partie, agir, onDossier, onClore });
  const pp = M.pleinsPouvoirs(partie);
  const reg = M.regimes[partie.regime?.id || "democratie"];
  const sieges = partie.politique.sieges;
  const allies = M.partis.filter((p) => p.id !== partie.camp && M.allie(partie.camp, p.id));
  const bloc = sieges[partie.camp] + allies.reduce((a, p) => a + sieges[p.id], 0);
  return h("div", { className: "rp-page rp-assemblee" },
    h("div", { className: cx("rp-scene", pp && "rp-scene--gelee") },
      h("div", { className: "rp-scene__tete" },
        h(Surtitre, null, pp ? "Assemblée suspendue" : "Palais Bourbon"),
        h("h1", { className: "rp-scene__titre" }, pp ? "Les sièges sont gelés" : reg.chambre),
        h("p", { className: "rp-scene__chapo" }, `Votre camp : ${sieges[partie.camp]} sièges. Avec vos alliés naturels (${allies.map((p) => p.court).join(", ") || "aucun"}) : ${bloc} sur 100. Majorité : 51.`)),
      h("div", { className: "rp-scene__hemi" },
        h(Hemicycle, { segments: segmentsComposition(sieges), camp: partie.camp, taille: 520, sombre: true, centre: [String(sieges[partie.camp]), "sièges pour votre camp"] }),
        h("ul", { className: "rp-scene__legende-partis", "aria-label": "Groupes parlementaires : toucher pour lire leur doctrine" }, ORDRE_PARTIS.map((id) => h("li", { key: id, style: { "--c": PARTIS[id].couleur } },
          h("button", { type: "button", className: cx("rp-scene__groupe", groupe?.id === id && groupe.ou === "scene" && "rp-scene__groupe--actif"), "aria-pressed": groupe?.id === id && groupe.ou === "scene", onClick: () => choisir(id, "scene") },
            h("i", null), PARTIS[id].court, h("b", null, sieges[id]), h("span", { className: "rp-scene__groupe-i", "aria-hidden": true }, "i"))))),
        groupe?.ou === "scene" && h(Doctrine, { key: groupe.id, partiId: groupe.id, sieges: sieges[groupe.id], onFermer: () => setGroupe(null) }))),
    partie.phase === "legislative" && !pp && h("p", { className: "rp-assemblee__aide" }, "Aucun texte en séance. Déposez un projet dont le rapport est prêt pour ouvrir le débat.", " ",
      h("button", { type: "button", className: "rp-lien", onClick: () => setOnglet("reformes") }, "Voir les réformes →")),
    reg.vote === "automatique" && h("p", { className: "rp-avertissement" }, "L'Assemblée ne siège plus : vos projets sont adoptés d'office, sans négociation ni 49.3."),
    reg.boycott && h("p", { className: "rp-avertissement" }, "La gauche boycotte l'Assemblée depuis l'adoption de la charte : ses élus ne votent plus."),
    h("div", { className: "rp-assemblee__grille" },
      h("div", { className: "rp-assemblee__col" },
        pp && h(M.PleinsPouvoirs, { partie, agir }),
        M.pmRequis(partie) ? h("div", { className: "rp-carte" }, h(M.NominationPM, { partie, agir })) : h(M.PanneauPM, { partie, agir }),
        h(Section, { titre: "Rapports de force", className: "rp-carte" },
          h("ul", { className: "rp-forces" }, ORDRE_PARTIS.map((id) => {
            const p = PARTIS[id], c = partie.politique.confiance[id];
            const rel = id === partie.camp ? ["Votre camp", "bleu"] : M.allie(partie.camp, id) ? ["Allié naturel", "vert"] : ["Opposition", "gris"];
            const ouvert = groupe?.id === id && groupe.ou === "forces";
            return h("li", { key: id, className: cx(ouvert && "rp-forces--ouvert") },
              h("button", { type: "button", className: "rp-forces__ligne", "aria-expanded": ouvert, onClick: () => choisir(id, "forces"), title: "Lire la doctrine du groupe" },
                h("span", { className: "rp-parti__puce", style: { background: p.couleur } }),
                h("span", { className: "rp-forces__nom" }, p.nom, h("small", null, ` ${sieges[id]} sièges`)),
                Math.abs(c) >= 0.01 && h("span", { className: c > 0 ? "rp-plus" : "rp-moins" }, `${c > 0 ? "▲" : "▼"} confiance`),
                h(Tampon, { ton: rel[1], petit: true }, rel[0]),
                h("span", { className: "rp-forces__chevron", "aria-hidden": true }, ouvert ? "−" : "+")),
              ouvert && h(Doctrine, { partiId: id }));
          })),
          h("p", { className: "rp-discret" }, "Touchez un groupe pour lire sa doctrine.")),
        partie.politique.promesses.length > 0 && h(Section, { titre: "Promesses en cours", className: "rp-carte" },
          h("ul", { className: "rp-promesses" }, partie.politique.promesses.map((pr) => h("li", { key: `${pr.loiId}-${pr.parti}` },
            h("button", { type: "button", className: "rp-lien", onClick: () => onDossier(pr.loiId) }, M.lois[pr.loiId].titre),
            h("small", null, `promis à ${PARTIS[pr.parti].court}, à déposer avant ${M.libTour(pr.echeance)}`)))))),
      h(Section, { titre: "Registre des scrutins", droite: h("button", { type: "button", className: "rp-lien", onClick: () => setOnglet("archives") }, "Tout voir"), className: "rp-carte" },
        h(Registre, { partie, max: 8, onDossier }),
        h("p", { className: "rp-discret" }, `49.3 utilisés : ${partie.politique.usages493.total}. Hors budget, un seul par an.`))));
}
