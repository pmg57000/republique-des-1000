/* ---------- Application ---------- */
function chargerPartie() {
  const p = M.lire(M.CLE, null);
  return p && p.version === M.VERSION ? p : null;
}

function ConfirmerCloture({ partie, onFermer, onConfirmer }) {
  const prets = M.rapportsPrets(partie).filter((id) => M.statutLoi(partie, M.lois[id]).disponible);
  const libres = M.etudeRequise(partie) ? M.limitesEtudes.max - M.etudesEnCours(partie).length : 0;
  return h(Panneau, { titre: "Clore le trimestre ?", surtitre: M.libTour(partie.tour), onFermer,
    pied: h("div", { className: "rp-pied-actions" }, h(Bouton, { variante: "ligne", onClick: onFermer }, "Revenir"), h(Bouton, { onClick: onConfirmer, className: "rp-pied-actions__principal" }, "Clore et passer au trimestre suivant")) },
    h("ul", { className: "rp-puces" },
      partie.pap > 0 && h("li", null, h("strong", null, `${partie.pap} point${partie.pap > 1 ? "s" : ""} d'action`), " seront perdus."),
      prets.length > 0 && h("li", null, `${prets.length} rapport${prets.length > 1 ? "s" : ""} prêt${prets.length > 1 ? "s" : ""} au vote : `, prets.map((id) => M.lois[id].titre).join(", "), "."),
      libres > 0 && h("li", null, `${libres} emplacement${libres > 1 ? "s" : ""} d'étude libre${libres > 1 ? "s" : ""} : une étude commandée maintenant sera prête au prochain trimestre.`)),
    h("p", { className: "rp-discret" }, "La simulation avance de trois mois. Vous découvrirez le bilan, les événements et la Une du trimestre suivant."));
}

function App() {
  const [partie, setPartie] = useState(chargerPartie);
  const [ecran, setEcran] = useState("accueil");
  const [onglet, setOngletBrut] = useState(() => { const o = M.lire(M.CLE_REPRISE, null)?.onglet; return ONGLETS.some((x) => x.id === o) ? o : ANCIENS_ONGLETS[o] || "trimestre"; });
  const [dossier, setDossier] = useState(null);
  const [comparaison, setComparaison] = useState([]);
  const [comparer, setComparer] = useState(false);
  const [feuille, setFeuille] = useState(null);
  const [une, setUne] = useState(null);
  const [revoirFin, setRevoirFin] = useState(false);
  const [aide, setAide] = useState(false);
  const [fiche, setFiche] = useState(null);
  const [terme, setTerme] = useState(null);
  const explications = useMemo(() => ({ fiche: setFiche, terme: setTerme }), []);
  const [briefing, setBriefing] = useState(false);
  const [alerte, setAlerte] = useState(null);
  const [sceau, setSceau] = useState(null);
  const [cloture, setCloture] = useState(false);
  const [tuto, setTuto] = useState(() => ({ actif: false, mode: "complet", index: 0, fini: false, ...(M.lire(TUTO_CLE, null) || {}) }));
  const [toasts, setToasts] = useState([]);
  const [fete, setFete] = useState(null);
  const [secousse, setSecousse] = useState(0);
  const [transition, setTransition] = useState(null);
  const mainRef = useRef(null);
  const agir = useCallback((fn) => setPartie((p) => (p ? fn(p) : p)), []);
  useEffect(() => { M.ecrire(TUTO_CLE, tuto); }, [tuto]);
  const tutoActif = useRef(false); tutoActif.current = tuto.actif;
  const notifier = useCallback((t) => {
    if (tutoActif.current && window.innerWidth < 760) return;
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((l) => [...l.slice(-2), { ...t, id }]);
    setTimeout(() => setToasts((l) => l.filter((x) => x.id !== id)), 3400);
  }, []);
  const feter = useCallback((n = 90) => { setFete({ cle: Date.now(), n }); M.son("accord"); }, []);
  const secouer = useCallback(() => setSecousse(Date.now()), []);
  useEffect(() => { if (!fete) return; const t = setTimeout(() => setFete(null), 3600); return () => clearTimeout(t); }, [fete]);
  useEffect(() => { if (!secousse) return; const t = setTimeout(() => setSecousse(0), 650); return () => clearTimeout(t); }, [secousse]);
  useEffetsDeJeu(partie, { notifier, feter, secouer });
  const setOnglet = useCallback((o) => { setOngletBrut(o); }, []);

  /* sauvegarde : mêmes clés, même format que la version précédente */
  useEffect(() => { if (partie) { M.ecrire(M.CLE, partie); M.ecrire(M.CLE_REPRISE, { le: Date.now(), onglet, tour: partie.tour }); } }, [partie, onglet]);
  const dernier = useRef(partie); dernier.current = partie;
  useEffect(() => {
    const save = () => { dernier.current && M.ecrire(M.CLE, dernier.current); };
    const vis = () => { document.visibilityState === "hidden" && save(); };
    window.addEventListener("pagehide", save); document.addEventListener("visibilitychange", vis);
    return () => { window.removeEventListener("pagehide", save); document.removeEventListener("visibilitychange", vis); };
  }, []);
  /* sons */
  const [son, setSon] = useState(M.sonEtat);
  useEffect(() => M.sonAbonner(setSon), []);
  M.sonsHook(partie, son && ecran === "jeu");
  /* démission d'un ministre */
  const nbAlertes = useRef(partie?.politique?.alertes?.length ?? null);
  useEffect(() => {
    const l = partie?.politique?.alertes || [];
    if (nbAlertes.current != null && l.length > nbAlertes.current) {
      const d = [...l].reverse().find((a) => a.type === "demission");
      if (d && d.tour === partie.tour) setAlerte({ ...d, cle: Date.now() });
    }
    nbAlertes.current = l.length;
  }, [partie]);
  /* enchaînements automatiques */
  useEffect(() => {
    if (ecran !== "jeu" || !partie) return;
    if (partie.phase === "assemblee" || partie.crisePolitique) setOnglet("assemblee");
    else if (decisionsEnAttente(partie).length) setOnglet("trimestre");
  }, [ecran]);
  const phasePrec = useRef(partie?.phase);
  useEffect(() => {
    if (partie?.phase === "assemblee" && phasePrec.current !== "assemblee") setOnglet("assemblee");
    if (phasePrec.current === "assemblee" && partie?.phase === "legislative") setOnglet("trimestre");
    phasePrec.current = partie?.phase;
  }, [partie?.phase, partie?.vote?.loiId]);
  const tourPrec = useRef(partie?.tour);
  const partiePrec = useRef(partie);
  useEffect(() => {
    if (tourPrec.current !== partie?.tour) {
      const avant = partiePrec.current;
      if (partie && avant && partie.tour === avant.tour + 1 && !partie.fin && partie.rapport?.precedent && !partie.rapport.ouverture && !MOUVEMENT_REDUIT) setTransition(donneesTransition(avant, partie));
      tourPrec.current = partie?.tour; setOnglet("trimestre"); setRevoirFin(false); setDossier(null); setComparer(false);
    }
  }, [partie?.tour]);
  useEffect(() => { partiePrec.current = partie; });
  useEffect(() => { if (ecran === "jeu" && partie) setUne(partie.fin?.une || null); }, [ecran, partie?.fin?.tour, partie?.fin?.cause]);
  const speciale = partie?.uneSpeciale;
  useEffect(() => { if (ecran === "jeu" && speciale) setUne(speciale); }, [speciale?.titre, speciale?.tour]);
  useEffect(() => { mainRef.current?.scrollTo({ top: 0, behavior: "instant" }); }, [onglet, partie?.tour, partie?.phase, partie?.vote?.statut]);
  useEffect(() => { if (!sceau) return; const t = setTimeout(() => setSceau(null), 1750); return () => clearTimeout(t); }, [sceau]);

  const ANCIEN = { reformes: "lois", assemblee: "assemblee", gouvernement: "conseil", pays: "village" };
  const [astuce, astuceVue] = M.astuce(aide || tuto.actif || ecran !== "jeu" ? null : ANCIEN[onglet] || null, partie);
  const lancer = ({ scenarioId, camp, tutoriel }) => {
    setPartie(M.nouvellePartie({ scenarioId, camp })); setOnglet("trimestre"); setRevoirFin(false); setComparaison([]); setEcran("jeu");
    setTuto((t) => ({ ...t, actif: !!tutoriel, mode: "complet", index: 0, fini: tutoriel ? t.fini : true }));
  };
  /* partie reprise sans avoir jamais vu le tutoriel : Hector propose la visite guidée */
  useEffect(() => {
    if (ecran !== "jeu" || !partie || partie.fin) return;
    setTuto((t) => (t.fini || t.actif ? t : { ...t, actif: true, mode: partie.tour === 1 && partie.phase === "bilan" ? "complet" : "visite", index: 0 }));
  }, [ecran]);
  const lancerTuto = () => setTuto((t) => ({ ...t, actif: true, mode: partie?.tour === 1 ? "complet" : "visite", index: 0 }));
  const retourAccueil = () => { setFeuille(null); setEcran("accueil"); };

  if (ecran === "accueil" || !partie) {
    return h("div", { id: "cadre", className: "rp-cadre rp-cadre--accueil" },
      h(Accueil, { tutoFini: tuto.fini, sauvegarde: M.resumeSauvegarde(partie, M.lire(M.CLE_REPRISE, null)), terminee: partie?.fin ? partie : null, onReprendre: () => setEcran("jeu"), onLancer: lancer, onPremium: (prod) => setFeuille({ premium: prod }) }),
      h(M.Premium, { feuille, onFermer: () => setFeuille(null) }));
  }

  const info = M.info(partie);
  const etape = prochaineEtape(partie);
  const clore = () => { setCloture(false); agir(M.clore); };
  const action = (a) => {
    if (a === "fin") { setUne(null); setRevoirFin(false); return; }
    if (a === "ouvrir") { agir(M.ouvrirSession); return; }
    if (a === "decisions") { setOnglet("trimestre"); setTimeout(() => document.getElementById("decisions")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60); return; }
    if (a === "assemblee") {
      if (onglet === "assemblee") document.getElementById("rp-suite")?.scrollIntoView({ behavior: "smooth", block: "center" });
      else setOnglet("assemblee");
      return;
    }
    if (a === "continuer") { agir(M.continuer); return; }
    if (a === "clore") {
      const reste = partie.pap > 0 && partie.phase !== "assemblee";
      if (reste) setCloture(true); else clore();
    }
  };
  const ouvrirDossier = (id) => setDossier(id);
  const basculerComparaison = (id) => setComparaison((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 3 ? c : [...c, id]));
  const contenu = {
    trimestre: h(EcranTrimestre, { partie, agir, info, etape, onAction: action, onDossier: ouvrirDossier, onLireUne: () => setUne(partie.rapport?.une), setOnglet }),
    reformes: h(EcranReformes, { partie, onDossier: ouvrirDossier, comparaison, setComparaison, onComparer: () => setComparer(true) }),
    assemblee: h(EcranAssemblee, { partie, agir, onDossier: ouvrirDossier, onClore: () => action("clore"), setOnglet }),
    gouvernement: h(EcranGouvernement, { partie, agir }),
    pays: h(EcranPays, { partie, onPremium: (prod) => setFeuille({ premium: prod }) }),
    archives: h(EcranArchives, { partie, onDossier: ouvrirDossier, onUne: setUne }),
  }[onglet];

  const ctxTuto = { p: partie, onglet, dossier, comparaison, comparer, cloture };
  return h(Explications.Provider, { value: explications }, h("div", { id: "cadre", className: cx("rp-cadre", `rp-cadre--${onglet}`, partie.phase === "assemblee" && "rp-cadre--seance", secousse && "rp-secousse") },
    h(Bandeau, { partie, info, etape, onAction: action, onAide: () => setAide(true), onReglages: () => setFeuille("reglages"), onTuto: lancerTuto }),
    h(Navigation, { onglet, setOnglet, partie }),
    h(TableauDeBord, { partie, info }),
    h("main", { ref: mainRef, className: "rp-contenu", "aria-label": ONGLETS.find((o) => o.id === onglet)?.lib },
      astuce && h("aside", { className: "rp-astuce", role: "note" },
        h("span", { className: "rp-astuce__i", "aria-hidden": true }, "i"),
        h("div", null, h("strong", null, astuce.titre), h("p", null, astuce.texte)),
        h(Bouton, { variante: "ligne", taille: "petit", onClick: astuceVue }, "Compris")),
      contenu),
    h("div", { className: "rp-dock" }, h(Prochaine, { partie, etape, onAction: action, variante: "dock" })),
    dossier && h(Dossier, {
      partie, loiId: dossier, comparaison, onCompare: basculerComparaison, onFermer: () => setDossier(null),
      onEtude: (id) => { agir((p) => M.commanderEtude(p, id)); M.son("nomination"); },
      onAbandon: (id) => { agir((p) => M.abandonnerEtude(p, id)); },
      onDeposer: (id) => { agir((p) => M.deposer(p, id)); setDossier(null); },
      onPromulguer: (id) => { agir((p) => M.promulguer(p, id)); setDossier(null); M.son("tampon"); setSceau({ type: "decret", titre: M.lois[id]?.titre, cle: Date.now() }); },
    }),
    comparer && comparaison.length > 0 && h(Comparateur, { partie, ids: comparaison, onFermer: () => setComparer(false), onDossier: (id) => { setComparer(false); setDossier(id); }, onEtude: (id) => { agir((p) => M.commanderEtude(p, id)); M.son("nomination"); }, onRetirer: (id) => { const n = comparaison.filter((x) => x !== id); setComparaison(n); if (n.length < 1) setComparer(false); } }),
    cloture && h(ConfirmerCloture, { partie, onFermer: () => setCloture(false), onConfirmer: clore }),
    aide && h(M.Aide, { onFermer: () => setAide(false), onReinitialiser: () => { setAide(false); lancerTuto(); }, onBriefing: () => { setAide(false); setBriefing(true); } }),
    briefing && h(M.Briefing, { onFermer: () => setBriefing(false) }),
    alerte && h(M.AlerteDemission, { key: alerte.cle, alerte, onFin: () => setAlerte(null) }),
    sceau && h("div", { key: sceau.cle, className: "rp-voile-sceau", role: "status" }, h(M.Sceau, { type: sceau.type, taille: 168 }), h("p", null, sceau.titre)),
    feuille === "reglages" && h(M.Reglages, { partie, onFermer: () => setFeuille(null), onNouvelle: retourAccueil, onEffacer: () => { M.effacer(M.CLE); setPartie(null); setFeuille(null); setEcran("accueil"); } }),
    h(M.Premium, { feuille, onFermer: () => setFeuille(null) }),
    partie.fin && !revoirFin && !une && h(M.FinMandat, { partie, onRejouer: retourAccueil, onRevoir: () => setRevoirFin(true) }),
    une && h(M.Une, { une, onFermer: () => setUne(null), libelleBouton: partie.fin && une === partie.fin.une ? "Voir le bilan du mandat" : "Fermer" }),
    transition && h(TransitionTrimestre, { donnees: transition, onFin: () => { if (transition.defi === "reussi") feter(120); setTransition(null); } }),
    h(Notifications, { liste: toasts, onFermer: (id) => setToasts((l) => l.filter((x) => x.id !== id)) }),
    h(Confettis, { fete }),
    fiche && h(FicheIndicateur, { partie, id: fiche, onFermer: () => setFiche(null) }),
    terme && h(FicheTerme, { id: terme, onFermer: () => setTerme(null) }),
    tuto.actif && !transition && !partie.fin && h(Tutoriel, { ctx: ctxTuto, tuto, setTuto, setOnglet })));
}

return { App };
})(__RP_M);
(0, __RP_M.createRoot)(document.getElementById("racine")).render(__RP_M.React.createElement(__RP_M.React.StrictMode, null, __RP_M.React.createElement(RP.App)));
