/* ---------- Comprendre le jeu : fiches d'indicateurs, glossaire, doctrines des groupes, pactes ----------
   Les textes viennent de la version de Steven (M.fichesIndicateurs, M.glossaire, M.doctrines…) ;
   ici on ne fait que les mettre en scène dans la direction artistique de la refonte. */
const Explications = R.createContext({ fiche: () => {}, terme: () => {} });
const useExplications = () => R.useContext(Explications);

/* Mot du glossaire : souligné en pointillés, une touche ouvre sa définition */
function Terme({ id, children }) {
  const { terme } = useExplications();
  if (!M.glossaire[id]) return children;
  return h("button", { type: "button", className: "rp-terme", onClick: (e) => { e.stopPropagation(); terme(id); }, "aria-label": `${typeof children === "string" ? children : M.glossaire[id].titre} : définition` }, children);
}

/* Texte libre : les mots du glossaire (MES, agences de notation, droit européen) deviennent touchables */
function Glose({ children }) {
  if (typeof children !== "string") return children ?? null;
  const morceaux = [];
  let reste = children, k = 0;
  while (reste) {
    let trouve = null;
    for (const [motif, id] of M.glossaireMotifs) {
      motif.lastIndex = 0;
      const m = motif.exec(reste);
      if (m && (!trouve || m.index < trouve.index)) trouve = { index: m.index, txt: m[0], id };
    }
    if (!trouve) { morceaux.push(reste); break; }
    if (trouve.index) morceaux.push(reste.slice(0, trouve.index));
    morceaux.push(h(Terme, { key: `t${k++}`, id: trouve.id }, trouve.txt));
    reste = reste.slice(trouve.index + trouve.txt.length);
  }
  return h(Fragment, null, ...morceaux);
}

/* Petite fenêtre centrée, façon carte à jouer */
function CarteModale({ titre, surtitre, onFermer, children, pied, className }) {
  const ref = useRef(null);
  useEffect(() => {
    const k = (ev) => { if (ev.key === "Escape") onFermer?.(); };
    window.addEventListener("keydown", k);
    const precedent = document.activeElement;
    ref.current?.focus();
    return () => { window.removeEventListener("keydown", k); precedent?.focus?.(); };
  }, []);
  return M.ReactDOM.createPortal(
    h("div", { className: cx("rp-cartemodale", className), role: "dialog", "aria-modal": "true", "aria-label": titre },
      h("button", { type: "button", className: "rp-cartemodale__voile", "aria-label": "Fermer", onClick: onFermer, tabIndex: -1 }),
      h("div", { className: "rp-cartemodale__carte", ref, tabIndex: -1 },
        h("button", { type: "button", className: "rp-fermer rp-cartemodale__fermer", onClick: onFermer, "aria-label": "Fermer" }, h(Icone, { nom: "fermer", taille: 16 })),
        surtitre && h(Surtitre, null, surtitre),
        h("h2", { className: "rp-cartemodale__titre" }, titre),
        children,
        pied && h("div", { className: "rp-cartemodale__pied" }, pied))),
    document.getElementById("cadre") || document.body);
}

/* Définition d'un mot : Hector explique */
function FicheTerme({ id, onFermer }) {
  const g = M.glossaire[id];
  if (!g) return null;
  return h(CarteModale, { titre: g.titre, surtitre: "Le mot d'Hector", onFermer, className: "rp-fiche-terme",
    pied: h(Bouton, { onClick: onFermer }, "Compris !") },
    h("div", { className: "rp-fiche-terme__quoi" },
      h(Hector, { humeur: "content", taille: 64 }),
      h("p", { className: "rp-bulle-hector" }, g.quoi)),
    h("dl", { className: "rp-fiche-terme__blocs" },
      [["jeu", "Dans le jeu", g.quand], ["plus", "Ce qu'il apporte", g.apporte], ["moins", "Ce qu'il coûte", g.coute]].map(([c, lib, txt]) =>
        h("div", { key: c, className: `rp-fiche-terme__bloc rp-fiche-terme__bloc--${c}` }, h("dt", null, lib), h("dd", null, txt)))));
}

/* Fiche d'un indicateur : finances, cohésion, emploi, popularité, points d'action, note du pays */
const FICHES_LIB = { finances: "Finances", cohesion: "Cohésion", emploi: "Emploi", popularite: "Popularité" };
function FicheIndicateur({ partie, id, onFermer }) {
  const info = M.info(partie);
  const f = M.fichesIndicateurs[id]?.({ ...info, macro: partie.macro, social: partie.social, chomeurs: partie.demo?.chomeurs });
  if (!f) return null;
  const v = { finances: info.jauges.santeFinanciere, cohesion: info.jauges.cohesionSociale, emploi: info.jauges.productiviteEmploi, popularite: info.popularite * 100 }[id];
  const tonSection = (i) => (id === "pap" || id === "note" ? "info" : ["info", "conseil", "danger", "attention"][i] || "info");
  return h(Panneau, { titre: f.titre, surtitre: "Comprendre l'indicateur", onFermer, className: "rp-fiche",
    pied: h(Bouton, { onClick: onFermer, className: "rp-fiche__ok" }, "Compris") },
    h("div", { className: cx("rp-fiche__tete", v != null && `rp-fiche__tete--${niveau(v)}`) },
      h("span", { className: "rp-fiche__pastille" },
        id === "pap" ? h(Jetons, { n: partie.pap, max: info.papMax }) : id === "note" ? h("b", null, info.notation?.note || "—") : h(IconeJauge, { lib: FICHES_LIB[id] })),
      h("strong", { className: "rp-fiche__valeur" }, f.valeur),
      v != null && h("span", { className: "rp-fiche__barre", "aria-hidden": true }, h("i", { style: { width: `${Math.max(0, Math.min(100, v))}%` } }))),
    f.chiffres && h("dl", { className: "rp-fiche__chiffres" }, f.chiffres.map(([k, val]) => h("div", { key: k }, h("dt", null, k), h("dd", null, val)))),
    h("div", { className: "rp-fiche__sections" },
      f.sections.map(([titre, texte], i) => h("section", { key: titre, className: `rp-fiche__section rp-fiche__section--${tonSection(i)}` },
        h("h3", null, titre), h("p", null, h(Glose, null, texte))))));
}

/* Bouton « ? » discret qui ouvre une fiche d'indicateur */
function BoutonFiche({ id, children, className, titre }) {
  const { fiche } = useExplications();
  return h("button", { type: "button", className: cx("rp-boutonfiche", className), onClick: () => fiche(id), "aria-label": titre || `${FICHES_LIB[id] || id} : explications` }, children);
}

/* Doctrine d'un groupe parlementaire */
function Doctrine({ partiId, sieges, onFermer, detaillee, defiler = true }) {
  const ref = useRef(null);
  useEffect(() => { if (defiler) ref.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" }); }, [partiId]);
  const p = PARTIS[partiId];
  if (!p) return null;
  const profil = M.profilsGroupes?.[partiId];
  return h("div", { ref, className: "rp-doctrine", style: { "--rp-parti": p.couleur }, role: "region", "aria-label": `Doctrine : ${p.nom}` },
    onFermer && h("button", { type: "button", className: "rp-fermer rp-doctrine__fermer", onClick: onFermer, "aria-label": "Fermer la fiche" }, h(Icone, { nom: "fermer", taille: 14 })),
    h("p", { className: "rp-doctrine__tete" }, h("span", { className: "rp-parti__puce", style: { background: p.couleur } }), h("strong", null, p.nom), sieges != null && h("small", null, `${sieges} siège${sieges > 1 ? "s" : ""}`)),
    detaillee && profil
      ? h("dl", { className: "rp-doctrine__profil" }, [["Qui ils sont", profil.qui], ["Ce qu'ils veulent", profil.veulent], ["Ce qu'ils refusent", profil.refusent], ["L'enjeu", profil.enjeu]].map(([k, v]) => h("div", { key: k }, h("dt", null, k), h("dd", null, v))))
      : h("p", { className: "rp-doctrine__texte" }, M.doctrines?.[partiId]));
}

/* Pactes de coalition en cours (promesses faites lors de l'investiture du Premier ministre) */
const pactesDe = (partie) => (M.pactes ? M.pactes(partie) : []);
const pactesPourLoi = (partie, loi) => pactesDe(partie).filter((pa) => pa.type === "loi" && pa.ministeres?.includes(loi.ministere));
const pacteMenace = (partie, loi) => (loi?.effets || []).some((e) => e.cible === "recettes.is" && e.valeur > 0) ? pactesDe(partie).filter((pa) => pa.type === "budget") : [];
function ListePactes({ partie, titre = true }) {
  const lst = pactesDe(partie);
  if (!lst.length) return null;
  return h("div", { className: "rp-pactes" },
    titre && h(Surtitre, null, "Pactes de coalition à tenir"),
    h("ul", null, lst.map((pa) => h("li", { key: pa.id, className: cx("rp-pacte", pa.reste <= 1 && "rp-pacte--urgent") },
      h("span", { className: "rp-pacte__sceau", "aria-hidden": true }, "✍"),
      h("span", { className: "rp-pacte__corps" }, h("strong", null, pa.nom), h("span", null, pa.texte)),
      h("span", { className: "rp-pacte__reste" }, pa.reste <= 0 ? "ce trimestre" : `${pa.reste} trim.`)))));
}
