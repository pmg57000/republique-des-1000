const RP = (function (M) {
"use strict";
const R = M.React;
const { useState, useEffect, useMemo, useRef, useCallback, Fragment } = R;
const h = (t, p, ...c) => R.createElement(t, p, ...c);
const cx = (...a) => a.filter(Boolean).join(" ");

const PARTIS = Object.fromEntries(M.partis.map((p) => [p.id, p]));
const GROUPES = Object.fromEntries(M.groupes.map((g) => [g.id, g]));
const MINIS = Object.fromEntries(M.ministeres.map((m) => [m.id, m]));
const ORDRE_PARTIS = M.partis.slice().sort((a, b) => a.position - b.position).map((p) => p.id);

/* Couleur et libellé court par ministère : onglets des chemises */
const MIN_STYLE = {
  fiscalite: ["#1c3fb7", "Fiscalité"], travail: ["#a34d00", "Travail"], retraites: ["#6b2fbf", "Retraites"],
  solidarite: ["#b8195d", "Solidarité"], sante: ["#0b7470", "Santé"], education: ["#0b67a8", "Éducation"],
  securite: ["#2f3a4f", "Sécurité"], ecologie: ["#14773b", "Écologie"], societe: ["#9c1aa6", "Société"],
  logement: ["#b8410b", "Logement"], strategie: ["#3f3bb5", "Stratégie"], croissance: ["#0a6e55", "Croissance"],
  collectivisation: ["#b3121b", "Collectivisation"],
};
const minCouleur = (id) => (MIN_STYLE[id] || ["#4a5160"])[0];
const minCourt = (id) => (MIN_STYLE[id] || [null, MINIS[id]?.nom || id])[1];

const nb = (v, d = 0) => M.nb(v, d);
const signe = (v, d = 0) => M.signe(v, d);
const fleche = (d, eps = 0.5) => (Math.abs(d) < eps ? "=" : d > 0 ? "▲" : "▼");
const ton = (d, sens = 1, eps = 0.5) => (Math.abs(d) < eps ? "neutre" : d * sens > 0 ? "bon" : "mauvais");
const raison = (t) => String(t || "").replace(/(\d+) PAP/g, (m, n) => `${n} point${n > 1 ? "s" : ""} d'action`);
const montant = (v) => (Math.abs(v) < 500 ? "0 €" : `${v > 0 ? "+" : "−"}${M.montant(Math.abs(v))}`);

/* ---------- Atomes ---------- */
function Bouton({ variante = "plein", taille, className, children, ...p }) {
  return h("button", { type: "button", className: cx("rp-btn", `rp-btn--${variante}`, taille && `rp-btn--${taille}`, className), ...p }, children);
}
function Tampon({ ton: t = "bleu", children, petit, className }) {
  return h("span", { className: cx("rp-tampon", `rp-tampon--${t}`, petit && "rp-tampon--petit", className) }, children);
}
function Pastille({ ton: t = "neutre", children, className, title }) {
  return h("span", { className: cx("rp-pastille", `rp-pastille--${t}`, className), title }, children);
}
function Surtitre({ children, className }) {
  return h("p", { className: cx("rp-surtitre", className) }, children);
}
function Icone({ nom, taille = 20, className }) {
  return h(M.Icone, { nom, taille, className });
}
function Jetons({ n, max, petit }) {
  const total = Math.max(max || 0, n);
  const prec = useRef(n);
  const [perdu, setPerdu] = useState(null);
  useEffect(() => {
    if (n < prec.current) { setPerdu({ de: n, a: prec.current, cle: Date.now() }); const t = setTimeout(() => setPerdu(null), 700); prec.current = n; return () => clearTimeout(t); }
    prec.current = n;
  }, [n]);
  return h("span", { className: cx("rp-jetons", petit && "rp-jetons--petit"), role: "img", "aria-label": `${n} point${n > 1 ? "s" : ""} d'action sur ${total}` },
    Array.from({ length: total }, (_, i) => h("span", { key: i, className: cx("rp-jeton", i < n && "rp-jeton--plein", perdu && i >= perdu.de && i < perdu.a && "rp-jeton--depense") })));
}
function Section({ num, titre, droite, children, className, id }) {
  return h("section", { className: cx("rp-section", className), id },
    (titre || num) && h("header", { className: "rp-section__tete" },
      h("h3", { className: "rp-section__titre" }, num && h("span", { className: "rp-section__num" }, num), titre),
      droite && h("div", { className: "rp-section__droite" }, droite)),
    children);
}
function Vide({ children }) {
  return h("p", { className: "rp-vide" }, children);
}

/* Fenêtre (panneau latéral sur ordinateur, plein écran sur mobile) : fermeture par Échap */
function Panneau({ titre, surtitre, onFermer, pied, children, large, className, couleur }) {
  const ref = useRef(null);
  useEffect(() => {
    const k = (ev) => { if (ev.key === "Escape") onFermer?.(); };
    window.addEventListener("keydown", k);
    const precedent = document.activeElement;
    ref.current?.focus();
    return () => { window.removeEventListener("keydown", k); precedent?.focus?.(); };
  }, []);
  return M.ReactDOM.createPortal(
    h("div", { className: cx("rp-panneau", large && "rp-panneau--large", className), role: "dialog", "aria-modal": "true", "aria-label": titre },
      h("button", { type: "button", className: "rp-panneau__voile", "aria-label": "Fermer", onClick: onFermer, tabIndex: -1 }),
      h("div", { className: "rp-panneau__feuille", ref, tabIndex: -1, style: couleur ? { "--rp-min": couleur } : null },
        h("header", { className: "rp-panneau__tete" },
          h("div", { className: "rp-panneau__titres" },
            surtitre && h(Surtitre, null, surtitre),
            h("h2", { className: "rp-panneau__titre" }, titre)),
          h("button", { type: "button", className: "rp-fermer", onClick: onFermer, "aria-label": "Fermer" }, h(Icone, { nom: "fermer", taille: 18 }))),
        h("div", { className: "rp-panneau__corps" }, children),
        pied && h("footer", { className: "rp-panneau__pied" }, pied))),
    document.getElementById("cadre") || document.body);
}

/* ---------- Hémicycle : 100 sièges dessinés en SVG ---------- */
const SIEGES = (() => {
  const rangs = 6, total = 100, r0 = 0.5, r1 = 1;
  const rayons = Array.from({ length: rangs }, (_, i) => r0 + ((r1 - r0) * i) / (rangs - 1));
  const somme = rayons.reduce((a, b) => a + b, 0);
  let comptes = rayons.map((r) => Math.round((total * r) / somme));
  let ecart = total - comptes.reduce((a, b) => a + b, 0);
  for (let i = rangs - 1; ecart !== 0; i = (i - 1 + rangs) % rangs) { comptes[i] += Math.sign(ecart); ecart -= Math.sign(ecart); }
  const pts = [];
  rayons.forEach((r, i) => {
    const n = comptes[i];
    for (let k = 0; k < n; k++) {
      const a = Math.PI - (Math.PI * (k + 0.5)) / n;
      pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, a, r });
    }
  });
  pts.sort((p, q2) => q2.a - p.a || p.r - q2.r);
  return pts;
})();

/* repartition : [{parti, n, etat}] dans l'ordre gauche → droite ; etat : "plein" | "creux" | "gris" */
function Hemicycle({ segments, camp, anime, cle, taille = 320, legende, centre, sombre, mise }) {
  const W = 220, H = 116, cxm = 110, cym = 108, R0 = 100;
  let i = 0;
  const cercles = [];
  for (const s of segments) {
    for (let k = 0; k < s.n && i < SIEGES.length; k++, i++) {
      const p = SIEGES[i];
      const coul = PARTIS[s.parti]?.couleur || "#999";
      const etat = s.etats ? s.etats[k] : s.etat || "plein";
      cercles.push(h("circle", {
        key: i, cx: cxm + p.x * R0, cy: cym - p.y * R0, r: 3.9,
        className: cx("rp-siege", `rp-siege--${etat}`, s.parti === camp && "rp-siege--camp"),
        style: { "--c": coul, animationDelay: anime ? `${Math.round(i * 14)}ms` : undefined },
      }));
    }
  }
  return h("figure", { className: cx("rp-hemi", sombre && "rp-hemi--sombre", mise && `rp-hemi--${mise}`), style: { maxWidth: taille } },
    h("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": legende || "Hémicycle de 100 sièges", key: cle },
      cercles,
      centre && h("text", { x: cxm, y: cym - 6, textAnchor: "middle", className: "rp-hemi__chiffre" }, centre[0])),
    centre?.[1] && h("figcaption", { className: "rp-hemi__legende" }, centre[1]));
}
const segmentsComposition = (sieges) => ORDRE_PARTIS.map((id) => ({ parti: id, n: sieges[id] || 0, etat: "plein" }));
const segmentsPrevision = (positions) => {
  const par = Object.fromEntries(positions.map((p) => [p.parti, p]));
  return ORDRE_PARTIS.map((id) => {
    const p = par[id]; if (!p) return { parti: id, n: 0 };
    const pour = Math.round(p.prob * p.sieges);
    return { parti: id, n: p.sieges, etats: Array.from({ length: p.sieges }, (_, k) => (k < pour ? "plein" : "creux")) };
  });
};
const segmentsResultat = (detail, sieges, cle = "pour") => {
  const par = Object.fromEntries(detail.map((d) => [d.parti, d]));
  return ORDRE_PARTIS.map((id) => {
    const n = sieges[id] || 0, d = par[id];
    const oui = d ? Math.min(n, d[cle] ?? 0) : 0;
    return { parti: id, n, etats: Array.from({ length: n }, (_, k) => (k < oui ? "plein" : "creux")) };
  });
};

/* ---------- Jauges ---------- */
const JAUGES = [
  ["santeFinanciere", "Finances", "Santé des comptes publics"],
  ["cohesionSociale", "Cohésion", "Satisfaction et calme social"],
  ["productiviteEmploi", "Emploi", "Activité, emploi, productivité"],
];
const niveau = (v) => (v >= 60 ? "bon" : v >= 40 ? "veille" : v >= 20 ? "serieux" : "critique");
const ICONES_JAUGE = {
  Finances: "M7 15c0-2 2.2-3.2 5-3.2s5 1.2 5 3.2-2.2 3.2-5 3.2S7 17 7 15Zm0 0v3.6c0 2 2.2 3.2 5 3.2s5-1.2 5-3.2V15M7 8.6c0-2 2.2-3.2 5-3.2s5 1.2 5 3.2-2.2 3.2-5 3.2S7 10.6 7 8.6Zm0 0v3.2m10-3.2v3.2",
  Cohésion: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z",
  Emploi: "M4 9h16v10H4zM9 9V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V9M4 13.5h16",
  Popularité: "m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4 7.2 18.9l.9-5.4L4.2 9.7l5.4-.8Z",
};
function IconeJauge({ lib }) {
  return h("svg", { viewBox: "0 0 24 24", className: "rp-jauge__icone", "aria-hidden": true },
    h("path", { d: ICONES_JAUGE[lib] || ICONES_JAUGE.Popularité, fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinejoin: "round", strokeLinecap: "round" }));
}
function useValeurAnimee(v, duree = 700) {
  const [aff, setAff] = useState(v);
  const [bulle, setBulle] = useState(null);
  const prec = useRef(v);
  useEffect(() => {
    const a = prec.current; prec.current = v;
    if (v == null || a == null || Math.abs(v - a) < 0.5) { setAff(v); return; }
    setBulle({ d: v - a, cle: Date.now() });
    let raf, t0;
    const pas = (t) => { t0 ??= t; const k = Math.min(1, (t - t0) / duree); setAff(a + (v - a) * (1 - (1 - k) ** 3)); if (k < 1) raf = requestAnimationFrame(pas); };
    raf = requestAnimationFrame(pas);
    const fin = setTimeout(() => setBulle(null), 1600);
    return () => { cancelAnimationFrame(raf); clearTimeout(fin); };
  }, [v]);
  return [aff, bulle];
}
function Jauge({ lib, valeur, delta, suffixe = "", aide, compacte, onClick }) {
  const [aff, bulle] = useValeurAnimee(valeur);
  const v = aff == null ? null : Math.max(0, Math.min(100, aff));
  return h(onClick ? "button" : "div", { type: onClick ? "button" : undefined, onClick, "aria-label": onClick ? `${lib} ${valeur == null ? "" : nb(valeur, 0)} : comprendre cet indicateur` : undefined,
    className: cx("rp-jauge", compacte && "rp-jauge--compacte", onClick && "rp-jauge--touchable", valeur != null && `rp-jauge--${niveau(valeur)}`), title: aide },
    onClick && h("span", { className: "rp-jauge__aide", "aria-hidden": true }, "?"),
    h("span", { className: "rp-jauge__pastille" }, h(IconeJauge, { lib })),
    h("span", { className: "rp-jauge__lib" }, lib),
    h("span", { className: "rp-jauge__val" }, aff == null ? "—" : nb(aff, 0), aff != null && suffixe && h("small", null, suffixe)),
    delta != null && Math.abs(delta) >= 0.5 && h("span", { className: cx("rp-jauge__delta", delta > 0 ? "rp-plus" : "rp-moins") }, `${fleche(delta)} ${nb(Math.abs(delta), 0)}`),
    h("span", { className: "rp-jauge__barre", "aria-hidden": true }, v != null && h("i", { style: { width: `${v}%` } })),
    bulle && h("b", { key: bulle.cle, className: cx("rp-jauge__bulle", bulle.d > 0 ? "rp-jauge__bulle--plus" : "rp-jauge__bulle--moins"), "aria-hidden": true }, `${bulle.d > 0 ? "+" : "−"}${nb(Math.abs(bulle.d), 0)}`));
}

/* ---------- Hector, conseiller spécial : la mascotte du jeu ---------- */
function Hector({ humeur = "neutre", parle, taille = 96, className }) {
  const yeux = humeur === "content"
    ? h("g", { className: "rp-hector__yeux", fill: "none", stroke: "#1d1b3d", strokeWidth: 2.4, strokeLinecap: "round" }, h("path", { d: "M45.5 57.5q3.5-4 7 0" }), h("path", { d: "M67.5 57.5q3.5-4 7 0" }))
    : h("g", { className: "rp-hector__yeux", fill: "#1d1b3d" }, h("circle", { cx: 49, cy: 57, r: humeur === "surpris" ? 3.2 : 2.6 }), h("circle", { cx: 71, cy: 57, r: humeur === "surpris" ? 3.2 : 2.6 }));
  const sourcils = {
    neutre: ["M43 45.5q6-3 12 0", "M65 45.5q6-3 12 0"], content: ["M43 44q6-4 12 0", "M65 44q6-4 12 0"],
    surpris: ["M43 41q6-4 12 0", "M65 41q6-4 12 0"], inquiet: ["M43 44l12 3", "M77 44l-12 3"],
  }[humeur] || ["M43 45.5q6-3 12 0", "M65 45.5q6-3 12 0"];
  return h("svg", { viewBox: "0 0 120 120", width: taille, height: taille, className: cx("rp-hector", parle && "rp-hector--parle", `rp-hector--${humeur}`, className), "aria-hidden": true },
    h("circle", { cx: 60, cy: 60, r: 57, fill: "#e7ecff", stroke: "#1d1b3d", strokeWidth: 3 }),
    h("clipPath", { id: "rp-hector-clip" }, h("circle", { cx: 60, cy: 60, r: 55.5 })),
    h("g", { clipPath: "url(#rp-hector-clip)" },
      h("path", { d: "M14 124c2-22 18-32 46-33 28 1 44 11 46 33Z", fill: "#2b2e72", stroke: "#1d1b3d", strokeWidth: 3 }),
      h("path", { d: "M47 91l13 15 13-15Z", fill: "#fff", stroke: "#1d1b3d", strokeWidth: 2.5, strokeLinejoin: "round" }),
      h("path", { d: "M47 92l-2 9 15-1Z", fill: "#3a5bff", stroke: "#1d1b3d", strokeWidth: 2.2, strokeLinejoin: "round" }),
      h("path", { d: "M73 92l2 9-15-1Z", fill: "#ff4f5e", stroke: "#1d1b3d", strokeWidth: 2.2, strokeLinejoin: "round" }),
      h("rect", { x: 56.5, y: 95.5, width: 7, height: 6, rx: 1.5, fill: "#fff", stroke: "#1d1b3d", strokeWidth: 2 })),
    h("rect", { x: 52, y: 78, width: 16, height: 14, fill: "#f6c49b", stroke: "#1d1b3d", strokeWidth: 2.5 }),
    h("circle", { cx: 33, cy: 60, r: 6, fill: "#f6c49b", stroke: "#1d1b3d", strokeWidth: 2.5 }),
    h("circle", { cx: 87, cy: 60, r: 6, fill: "#f6c49b", stroke: "#1d1b3d", strokeWidth: 2.5 }),
    h("ellipse", { cx: 60, cy: 58, rx: 26, ry: 29, fill: "#ffd8b8", stroke: "#1d1b3d", strokeWidth: 3 }),
    h("path", { d: "M35 56c-2-10 1-19 7-23M85 56c2-10-1-19-7-23", fill: "none", stroke: "#9aa0b8", strokeWidth: 6, strokeLinecap: "round" }),
    h("path", { d: "M52 31c3-6 12-7 15-2-4-1-8 0-10 3", fill: "#9aa0b8", stroke: "#1d1b3d", strokeWidth: 2, strokeLinejoin: "round" }),
    h("ellipse", { cx: 66, cy: 36, rx: 5, ry: 2.5, fill: "#fff", opacity: 0.55, transform: "rotate(-20 66 36)" }),
    h("g", { className: "rp-hector__sourcils", fill: "none", stroke: "#1d1b3d", strokeWidth: 2.6, strokeLinecap: "round" }, h("path", { d: sourcils[0] }), h("path", { d: sourcils[1] })),
    h("circle", { cx: 49, cy: 57, r: 9, fill: "rgba(255,255,255,.55)", stroke: "#1d1b3d", strokeWidth: 2.6 }),
    h("circle", { cx: 71, cy: 57, r: 9, fill: "rgba(255,255,255,.55)", stroke: "#1d1b3d", strokeWidth: 2.6 }),
    h("path", { d: "M58 57h4", stroke: "#1d1b3d", strokeWidth: 2.6 }),
    yeux,
    h("circle", { cx: 42, cy: 70, r: 4.5, fill: "#ff8f9b", opacity: 0.45 }), h("circle", { cx: 78, cy: 70, r: 4.5, fill: "#ff8f9b", opacity: 0.45 }),
    h("path", { d: "M60 60q-3 7 1 8", fill: "none", stroke: "#1d1b3d", strokeWidth: 2.2, strokeLinecap: "round" }),
    h("ellipse", { className: "rp-hector__bouche", cx: 60, cy: 78.5, rx: humeur === "surpris" ? 4 : 5.5, ry: humeur === "surpris" ? 4 : humeur === "content" ? 3.2 : 2.2, fill: "#7a1f2f", stroke: "#1d1b3d", strokeWidth: 2 }),
    h("path", { d: "M46 73c4-5 10-5 14-2 4-3 10-3 14 2-5 3-9 2-14 0-5 2-9 3-14 0Z", fill: "#9aa0b8", stroke: "#1d1b3d", strokeWidth: 2, strokeLinejoin: "round" }));
}

/* ---------- Fiche statique d'un projet (ce que l'on sait avant l'étude) ---------- */
const memoFiche = new Map();
function fiche(loi) {
  if (memoFiche.has(loi.id)) return memoFiche.get(loi.id);
  const score = {};
  let tous = 0;
  for (const ef of loi.effets || []) {
    const [c, s] = ef.cible.split(".");
    if (c !== "satisfaction" && c !== "revenu") continue;
    if (s === "conso") { tous += Math.sign(ef.valeur) * 0.5; continue; }
    if (s === "tous") { tous += Math.sign(ef.valeur); continue; }
    if (GROUPES[s]) score[s] = (score[s] || 0) + Math.sign(ef.valeur) * Math.min(4, Math.abs(ef.valeur)) * (c === "satisfaction" ? 1 : 1.5);
  }
  const lst = Object.entries(score).filter(([, v]) => Math.abs(v) >= 0.4).sort((a, b) => b[1] - a[1]);
  const gagnants = lst.filter(([, v]) => v > 0).map(([id]) => id);
  const perdants = lst.filter(([, v]) => v < 0).reverse().map(([id]) => id);
  const soutiens = ORDRE_PARTIS.map((id) => ({ id, v: loi.soutien?.[id] ?? 0.5 }));
  const pourSieges = soutiens.reduce((a, s) => a + s.v * (PARTIS[s.id]?.sieges || 0), 0);
  const cumul = new Map();
  for (const ef of loi.effets || []) {
    if (/^(satisfaction|radicalisation|revenu|confiance|effectif|recettes|depenses)\./.test(ef.cible)) continue;
    cumul.set(ef.cible, (cumul.get(ef.cible) || 0) + ef.valeur);
  }
  const macro = [...cumul].slice(0, 3).map(([cible, valeur]) => M.effetTexte({ cible, valeur }));
  const f = { gagnants, perdants, tous, soutiens, pourSieges, macro, delaiMax: Math.max(0, ...(loi.effets || []).map((ef) => (ef.delai || 0) + (ef.rampe || 0))) };
  memoFiche.set(loi.id, f);
  return f;
}
function Spectre({ loi, grand }) {
  const f = fiche(loi);
  return h("span", { className: cx("rp-spectre", grand && "rp-spectre--grand"), role: "img", "aria-label": `Accueil probable : ${f.soutiens.map((s) => `${PARTIS[s.id].court} ${Math.round(s.v * 100)} %`).join(", ")}` },
    f.soutiens.map((s) => h("i", { key: s.id, style: { height: `${Math.max(8, s.v * 100)}%`, background: PARTIS[s.id].couleur }, title: `${PARTIS[s.id].court} : ${s.v >= 0.6 ? "favorable" : s.v <= 0.3 ? "hostile" : "partagé"}` })));
}
const orientation = (loi) => {
  const f = fiche(loi);
  const fav = f.soutiens.filter((s) => s.v >= 0.6).map((s) => PARTIS[s.id].court);
  const hos = f.soutiens.filter((s) => s.v <= 0.3).map((s) => PARTIS[s.id].court);
  return { fav, hos };
};

/* état d'un dossier dans la chaîne Fiche → Étude → Rapport → Vote */
function etatDossier(p, loi) {
  if (loi.id in p.lois.adoptees) return { cle: "vigueur", lib: "En vigueur", ton: "bleu" };
  if (p.vote?.loiId === loi.id) return { cle: "vote", lib: "En séance", ton: "rouge" };
  const et = M.etude(p, loi.id);
  if (et?.etat === "prete") return { cle: "rapport", lib: "Rapport prêt", ton: "vert" };
  if (et?.etat === "cours") return { cle: "etude", lib: `À l'étude · ${M.libTour(et.prete)}`, ton: "ambre" };
  if (!M.etudeRequise(p)) return { cle: "libre", lib: "Projet", ton: "gris" };
  return { cle: "fiche", lib: "Projet", ton: "gris" };
}
