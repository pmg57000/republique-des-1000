/* ---------- Effets de jeu : confettis, notifications, secousse, transition de trimestre ---------- */
const MOUVEMENT_REDUIT = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const COULEURS_FETE = ["#3a5bff", "#ff4f5e", "#ffc93c", "#22c88a", "#8b5cf6", "#ffffff", "#ff8a3d"];

function Confettis({ fete }) {
  const pieces = useMemo(() => {
    if (!fete) return [];
    return Array.from({ length: fete.n || 90 }, (_, i) => ({
      i, x: Math.random() * 100, d: Math.random() * 0.5, t: 1.6 + Math.random() * 1.4,
      c: COULEURS_FETE[i % COULEURS_FETE.length], r: Math.random() * 360, w: 6 + Math.random() * 8, rond: Math.random() < 0.3,
      dx: (Math.random() - 0.5) * 160,
    }));
  }, [fete?.cle]);
  if (!fete || MOUVEMENT_REDUIT) return null;
  return h("div", { className: "rp-confettis", "aria-hidden": true, key: fete.cle },
    pieces.map((p) => h("i", { key: p.i, style: {
      left: `${p.x}%`, background: p.c, width: p.w, height: p.rond ? p.w : p.w * 0.45, borderRadius: p.rond ? "50%" : 2,
      animationDuration: `${p.t}s`, animationDelay: `${p.d}s`, "--r": `${p.r}deg`, "--dx": `${p.dx}px`,
    } })));
}

function Notifications({ liste, onFermer }) {
  return h("div", { className: "rp-toasts", role: "status", "aria-live": "polite" },
    liste.map((t) => h("button", { key: t.id, type: "button", className: cx("rp-toast", `rp-toast--${t.ton || "bleu"}`), onClick: () => onFermer(t.id) },
      h("span", { className: "rp-toast__icone", "aria-hidden": true }, t.icone || "★"),
      h("span", { className: "rp-toast__texte" }, h("strong", null, t.titre), t.texte && h("small", null, t.texte)))));
}

/* Compare l'état avant/après chaque action pour déclencher les effets */
function useEffetsDeJeu(partie, { notifier, feter, secouer }) {
  const prec = useRef(partie);
  useEffect(() => {
    const a = prec.current, b = partie;
    prec.current = partie;
    if (!a || !b || a === b) return;
    const timers = [];
    const plusTard = (ms, fn) => timers.push(setTimeout(fn, ms));
    const coursA = M.etudesEnCours(a), coursB = M.etudesEnCours(b);
    if (a.tour === b.tour) {
      coursB.filter((id) => !coursA.includes(id)).forEach((id) => notifier({ icone: "📋", ton: "ambre", titre: "Étude commandée", texte: `${M.lois[id].titre} · rapport ${M.libTour(M.etude(b, id).prete)}` }));
      coursA.filter((id) => !coursB.includes(id) && !(id in b.lois.adoptees) && !M.etude(b, id)).forEach((id) => notifier({ icone: "🗑️", ton: "gris", titre: "Étude annulée", texte: M.lois[id].titre }));
    }
    if (!a.vote && b.vote?.statut === "debat") notifier({ icone: "🏛️", ton: "rouge", titre: "En séance !", texte: M.lois[b.vote.loiId].titre });
    if (a.vote && b.vote && a.vote.loiId === b.vote.loiId) {
      const na = Object.keys(a.vote.negociations || {}), nbb = Object.keys(b.vote.negociations || {});
      nbb.filter((x) => !na.includes(x)).forEach((x) => { notifier({ icone: "🤝", ton: "vert", titre: `Accord avec ${PARTIS[x].court}`, texte: b.vote.negociations[x] === "promesse" ? "Promesse de loi" : "Concession budgétaire" }); M.son("accord"); });
      if ((b.vote.amendements?.length || 0) > (a.vote.amendements?.length || 0)) { notifier({ icone: "✏️", ton: "vert", titre: "Amendement adopté", texte: b.vote.amendements[b.vote.amendements.length - 1].titre }); M.son("accord"); }
      if (a.vote.statut === "debat" && b.vote.statut !== "debat") {
        if (b.vote.statut === "adoptee" || b.vote.statut === "adoptee493") plusTard(1500, () => feter(b.vote.statut === "adoptee" ? 140 : 60));
        else plusTard(1500, () => secouer());
      }
    }
    if (!a.politique?.pm && b.politique?.pm && a.tour === b.tour) {
      plusTard(200, () => { feter(70); notifier({ icone: "🎩", ton: "vert", titre: "Nouveau Premier ministre", texte: M.pmProfil?.(b)?.nom || "Le gouvernement est formé" }); });
    }
    if (!a.crisePolitique && b.crisePolitique) secouer();
    return () => timers.forEach(clearTimeout);
  }, [partie]);
}

/* Cinématique de passage au trimestre suivant */
function TransitionTrimestre({ donnees, onFin }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = [setTimeout(() => setPhase(1), 900), setTimeout(() => setPhase(2), 1900), setTimeout(() => setPhase(3), 2700)];
    return () => t.forEach(clearTimeout);
  }, []);
  useEffect(() => { const k = (e) => { if (e.key === "Escape" || e.key === "Enter") onFin(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  const { avant, apres, une, deltas, votes, defi } = donnees;
  return h("div", { className: cx("rp-transition", `rp-transition--${phase}`), role: "dialog", "aria-label": `Passage au ${apres}`, onClick: () => phase >= 1 && onFin() },
    h("div", { className: "rp-transition__fond", "aria-hidden": true }, Array.from({ length: 14 }, (_, i) => h("i", { key: i, style: { "--i": i } }))),
    h("div", { className: "rp-transition__calendrier", "aria-hidden": phase > 0 },
      h("div", { className: "rp-calendrier" },
        h("span", { className: "rp-calendrier__page rp-calendrier__page--avant" }, avant),
        h("span", { className: "rp-calendrier__page rp-calendrier__page--apres" }, apres)),
      h("p", { className: "rp-transition__texte" }, "Trois mois plus tard…")),
    phase >= 1 && une && h("div", { className: "rp-transition__journal" },
      h("span", { className: "rp-transition__nom" }, "Le Quotidien de la République"),
      h("strong", null, une.titre),
      une.article?.[0] && h("small", null, une.article[0])),
    phase >= 2 && h("div", { className: "rp-transition__deltas" },
      deltas.map((d, i) => h("span", { key: d.lib, className: cx("rp-transition__delta", `rp-transition__delta--${ton(d.d)}`), style: { animationDelay: `${i * 110}ms` } },
        h(IconeJauge, { lib: d.lib }), h("em", null, d.lib), h("b", null, Math.abs(d.d) < 0.5 ? "=" : `${d.d > 0 ? "+" : "−"}${nb(Math.abs(d.d), 0)}`))),
      votes > 0 && h("span", { className: "rp-transition__delta rp-transition__delta--bon", style: { animationDelay: "480ms" } }, "🗳️", h("em", null, "Lois adoptées"), h("b", null, votes)),
      defi && h("span", { className: cx("rp-transition__delta", defi === "reussi" ? "rp-transition__delta--bon" : "rp-transition__delta--mauvais"), style: { animationDelay: "560ms" } }, defi === "reussi" ? "🏆" : "💥", h("em", null, "Défi de l'année"), h("b", null, defi === "reussi" ? "réussi" : "manqué"))),
    phase >= 1 && h(Bouton, { taille: "grand", className: "rp-transition__btn", onClick: (e) => { e.stopPropagation(); onFin(); } }, `Découvrir le bilan du ${apres}`));
}

function donneesTransition(avantPartie, partie) {
  const r = partie.rapport;
  const deltas = JAUGES.map(([cle, lib]) => ({ lib, d: r.actuel.jauges[cle] - r.precedent.jauges[cle] }))
    .concat([{ lib: "Popularité", d: (r.actuel.popularite - r.precedent.popularite) * 100 }]);
  const j = r.journal || [];
  return {
    avant: M.libTour(avantPartie.tour), apres: M.libTour(partie.tour), une: r.une, deltas,
    votes: j.filter((e) => e.type === "vote" && e.loiId).length,
    defi: j.some((e) => e.defiReussi) ? "reussi" : j.some((e) => e.defiRate) ? "rate" : null,
  };
}
