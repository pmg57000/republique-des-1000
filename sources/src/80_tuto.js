/* ---------- Tutoriel guidé par Hector ----------
   Les étapes avancent toutes seules quand le joueur fait ce qui est demandé (état de la partie),
   ou d'un clic sur « Suivant » pour les explications. Une étape devenue sans objet est sautée. */
const TUTO_CLE = "republique1000.tuto";
const nbEtudes = (p) => M.etudesEnCours(p).length + M.rapportsPrets(p).length + Object.keys(p.lois.adoptees).length;
const rapportOuvert = (c) => !!c.dossier && M.etude(c.p, c.dossier)?.etat === "prete";
const BTN_SUITE = [".rp-trimestre__suite .rp-btn", ".rp-prochaine__btn"];

const ETAPES_COMPLET = [
  { id: "bienvenue", humeur: "content", titre: "Bienvenue à l'Élysée !", bouton: "On y va !",
    texte: "Je suis Hector, votre conseiller spécial. Votre mission : gouverner un pays de 1 000 habitants pendant cinq ans… puis vous faire réélire. Le jour de l'élection, il faudra qu'au moins la moitié des citoyens soient satisfaits.",
    valable: (c) => c.p.tour === 1 },
  { id: "jauges", titre: "Votre tableau de bord",
    texte: "Quatre jauges résument l'état du pays : les finances, la cohésion sociale, l'emploi… et votre popularité, la plus précieuse. Si une jauge plonge dans le rouge, c'est la crise. Touchez-en une pour savoir comment l'améliorer.",
    cible: () => [".rp-tdb--vertical", ".rp-tdb"], valable: (c) => c.p.tour === 1 },
  { id: "pieces", titre: "Vos pièces d'action",
    texte: "Ces pièces sont vos points d'action. Déposer une loi coûte 1 ou 2 pièces. Elles se rechargent à chaque trimestre mais ne s'accumulent pas : ne les laissez pas dormir !",
    cible: () => [".rp-bandeau__pap"], valable: (c) => c.p.tour === 1 },
  { id: "journal", humeur: "inquiet", titre: "Le journal du trimestre",
    texte: "Chaque trimestre commence par la Une du journal, qui raconte ce qui s'est passé. Aujourd'hui, elle résume l'héritage de votre prédécesseur… pas brillant.",
    cible: () => [".rp-une-tete"], valable: (c) => c.p.tour === 1 && c.p.phase === "bilan" && c.onglet === "trimestre" },
  { id: "ouvrir", titre: "Au travail !", texte: "Cliquez sur « Ouvrir la session » pour commencer à gouverner.",
    cible: () => BTN_SUITE, fait: (c) => c.p.phase !== "bilan" || c.p.tour > 1 },
  { id: "missions", titre: "Vos missions",
    texte: "Voici vos missions du trimestre. Au début, aucune loi n'est prête : avant d'aller au vote, chaque projet doit passer par une étude d'impact, faite par des experts.",
    cible: () => [".rp-odj"], valable: (c) => c.p.tour === 1 && c.p.phase === "legislative" && c.onglet === "trimestre" },
  { id: "reformes", titre: "Les réformes", texte: "Ouvrez l'onglet « Réformes » : 238 projets de loi vous y attendent.",
    cible: () => ['.rp-nav__onglet[data-onglet="reformes"]'], fait: (c) => c.onglet === "reformes" || c.p.tour > 1 || nbEtudes(c.p) >= 1 },
  { id: "cartes", titre: "Une carte = une réforme",
    texte: "Sur chaque carte : ce que la réforme rapporte ou coûte à l'État, qui y gagne (▲) et qui y perd (▼). Les petites barres de couleur montrent quels partis l'aiment.",
    cible: () => [".rp-catalogue .rp-chemise"], valable: (c) => c.onglet === "reformes" && c.p.tour === 1 && !c.dossier && !c.comparer && nbEtudes(c.p) === 0 },
  { id: "comparer", titre: "Comparez !", texte: "Cochez « Comparer » sur deux réformes qui vous tentent.",
    cible: () => [".rp-catalogue .rp-chemise__comparer"], fait: (c) => c.comparaison.length >= 2 || nbEtudes(c.p) >= 1 || c.p.tour > 1 },
  { id: "comparateur", titre: "Le comparateur", texte: "Parfait ! Ouvrez maintenant le comparateur, en bas de l'écran.",
    cible: () => [".rp-tiroir .rp-btn"], fait: (c) => c.comparer || nbEtudes(c.p) >= 1 || c.p.tour > 1 },
  { id: "etude", titre: "Commandez une étude",
    texte: "Vos deux réformes, côte à côte. Laquelle vous plaît le plus ? Commandez son étude d'impact : c'est gratuit, mais vous n'avez que deux emplacements.",
    cible: () => [".rp-comparateur .rp-comp__rang--actions", ".rp-dossier .rp-pied-actions__principal", ".rp-tiroir .rp-btn"], fait: (c) => nbEtudes(c.p) >= 1 || c.p.tour > 1 },
  { id: "etude2", humeur: "content", titre: "Bien joué !", bouton: "Une étude suffit",
    texte: "Les experts sont au travail : leur rapport arrivera au prochain trimestre. Vous pouvez commander une deuxième étude, ou passer à la suite.",
    cible: () => [".rp-comparateur .rp-comp__rang--actions", ".rp-parapheur"], fait: (c) => nbEtudes(c.p) >= 2 || c.p.tour > 1 },
  { id: "clore", titre: "Le temps passe…",
    texte: "Vous avez fait le tour du premier trimestre. Cliquez sur « Clore le trimestre » : trois mois vont s'écouler.",
    cible: (c) => (c.cloture ? [".rp-panneau__pied .rp-pied-actions__principal"] : c.comparer || c.dossier ? [".rp-panneau .rp-fermer"] : [".rp-prochaine__btn"]),
    fait: (c) => c.p.tour > 1 },
  { id: "bilan2", humeur: "surpris", titre: "Trois mois plus tard !",
    texte: "Le bilan montre ce qui a changé : les barres hachurées, c'était avant ; les barres colorées, c'est maintenant. Et des élections législatives viennent d'avoir lieu…",
    cible: () => [".rp-election", ".rp-avantapres"], valable: (c) => c.p.tour === 2 && c.p.phase === "bilan" },
  { id: "decisions", titre: "Une décision vous attend",
    texte: (c) => (M.pmRequis(c.p)
      ? "Il vous faut un Premier ministre. Proposez un candidat, cochez jusqu'à 3 compromis pour rallier des groupes, puis lancez le vote de confiance : il faut 51 voix. Attention, chaque promesse doit être tenue !"
      : "Tranchez les décisions encadrées en rouge : la session ne s'ouvrira pas avant."),
    cible: () => ["#decisions"], fait: (c) => decisionsEnAttente(c.p).length === 0 || c.p.tour > 2 },
  { id: "ouvrir2", titre: "C'est reparti", texte: "Le gouvernement est en place. Ouvrez la session !",
    cible: () => BTN_SUITE, fait: (c) => c.p.phase !== "bilan" || c.p.tour > 2 },
  { id: "rapport", humeur: "content", titre: "Votre rapport est arrivé !", texte: "Le rapport d'impact est prêt. Ouvrez-le pour découvrir le verdict des experts.",
    cible: () => [".rp-odj__item--vert .rp-btn", ".rp-parapheur .rp-fente--prete"],
    valable: (c) => c.p.tour === 2 && (M.rapportsPrets(c.p).length > 0 || !!c.p.vote), fait: (c) => rapportOuvert(c) || !!c.p.vote },
  { id: "verdict", titre: "Le verdict des experts",
    texte: "Voici l'effet de la loi dans un an, comparé à « ne rien faire ». Vert, c'est bon pour le pays ; rouge, ça fait mal.",
    cible: () => [".rp-dossier .rp-deltas--grand"], valable: (c) => rapportOuvert(c) && !c.p.vote },
  { id: "chances", titre: "Vos chances au vote",
    texte: "Et ici, vos chances à l'Assemblée. Au-dessus de 60 % : foncez. En dessous, il faudra négocier en séance.",
    cible: () => [".rp-dossier .rp-proba"], valable: (c) => rapportOuvert(c) && !c.p.vote },
  { id: "soumettre", titre: "Direction le Parlement", texte: "Soumettez le projet au vote. Ça vous coûtera une ou deux pièces.",
    cible: () => [".rp-dossier .rp-pied-actions__principal", ".rp-odj__item--vert .rp-btn"],
    valable: (c) => c.p.tour === 2 && (M.rapportsPrets(c.p).length > 0 || !!c.p.vote), fait: (c) => !!c.p.vote },
  { id: "hemicycle", humeur: "surpris", titre: "Bienvenue dans l'hémicycle",
    texte: "Chaque point est un député. Disque plein : il devrait voter pour. Il faut 51 voix sur 100.",
    cible: () => [".rp-seance .rp-scene__hemi"], valable: (c) => c.p.vote?.statut === "debat" },
  { id: "negocier", titre: "L'art de la négociation",
    texte: "C'est serré ? Cliquez sur un groupe indécis pour négocier : une promesse de loi ou un chèque. Même votre camp peut traîner les pieds : regardez son pourcentage !",
    cible: () => [".rp-seance .rp-partis"], valable: (c) => c.p.vote?.statut === "debat" },
  { id: "voter", titre: "Le moment de vérité", texte: "Quand vous êtes prêt, lancez le vote !",
    cible: () => [".rp-seance__decision .rp-btn--grand"], valable: (c) => !!c.p.vote, fait: (c) => !c.p.vote || c.p.vote.statut !== "debat" },
  { id: "resultat", attente: 1900,
    humeur: (c) => (/adoptee/.test(c.p.vote?.statut || "") ? "content" : "inquiet"),
    titre: (c) => (/adoptee/.test(c.p.vote?.statut || "") ? "Adoptée !" : "Rejetée…"),
    texte: (c) => (/adoptee/.test(c.p.vote?.statut || "")
      ? "Bravo ! La loi s'applique dès maintenant : ses effets apparaîtront dans le prochain bilan."
      : "Ça arrive aux meilleurs. Le rapport reste valable : vous pourrez redéposer le projet plus tard, après avoir négocié."),
    cible: () => ["#rp-suite"], valable: (c) => !!c.p.vote && c.p.vote.statut !== "debat" && c.onglet === "assemblee" },
  { id: "fin", humeur: "content", titre: "Vous êtes prêt !", bouton: "À moi de jouer !",
    texte: "Vous connaissez l'essentiel. Le reste s'apprend en jouant : le Gouvernement, le Pays, les Archives… Si vous êtes perdu, le bouton « Tutoriel » en haut de l'écran me rappelle pour une visite guidée. Bonne chance pour votre mandat !" },
];

const ETAPES_VISITE = [
  { id: "v-debut", humeur: "content", titre: "Bonjour, je suis Hector !", bouton: "Allons-y", texte: "Votre conseiller spécial. Je vous fais faire le tour du jeu en quelques étapes. Vous pouvez arrêter à tout moment, et me rappeler avec le bouton « Tutoriel » en haut de l'écran." },
  { id: "v-jauges", onglet: "trimestre", titre: "Le tableau de bord", texte: "Finances, cohésion, emploi et popularité : vos quatre jauges. La popularité doit dépasser 50 % le jour de l'élection.", cible: () => [".rp-tdb--vertical", ".rp-tdb"] },
  { id: "v-pieces", titre: "Les pièces d'action", texte: "Un dépôt de loi coûte 1 ou 2 pièces. Elles se rechargent chaque trimestre, sans s'accumuler.", cible: () => [".rp-bandeau__pap"] },
  { id: "v-etapes", titre: "Trois temps par trimestre", texte: "Le bilan (ce qui s'est passé), la session (études et dépôts), la séance (les votes). Le gros bouton vous indique toujours la suite.", cible: () => [".rp-etapes", ".rp-prochaine__btn"] },
  { id: "v-trimestre", onglet: "trimestre", titre: "Le Trimestre", texte: "Le bilan, les décisions urgentes et vos missions. C'est votre point de départ à chaque trimestre.", cible: () => ["#decisions", ".rp-odj", ".rp-une-tete"] },
  { id: "v-reformes", onglet: "reformes", titre: "Les Réformes", texte: "Vos études en cours, vos rapports prêts, et 238 projets à comparer. Un projet ne se vote qu'après son étude d'impact.", cible: () => [".rp-parapheur", ".rp-page__tete"] },
  { id: "v-assemblee", onglet: "assemblee", titre: "L'Assemblée", texte: "Les forces en présence, la séance publique et le registre de tous les votes. Il faut 51 voix sur 100.", cible: () => [".rp-scene"] },
  { id: "v-gouv", onglet: "gouvernement", titre: "Le Gouvernement", texte: "Votre Premier ministre et vos ministres. Attention : un ministre fâché peut claquer la porte.", cible: () => [".rp-page__tete"] },
  { id: "v-pays", onglet: "pays", titre: "Le Pays", texte: "Les 1 000 citoyens, groupe par groupe, et tous les indicateurs économiques.", cible: () => [".rp-page__tete"] },
  { id: "v-archives", onglet: "archives", titre: "Les Archives", texte: "Chaque bilan, chaque rapport, chaque vote et chaque Une : tout y est rangé.", cible: () => [".rp-page__tete"] },
  { id: "v-fin", humeur: "content", titre: "À vous de jouer !", bouton: "Merci Hector", texte: "Vous savez où tout se trouve. Je reste dans le coin si besoin." },
];

const VOILES = '#cadre .feuille, #cadre [class*="z-[65]"], #cadre .bg-journal.inset-0, #cadre .salle, .rp-transition';
const valeur = (v, c) => (typeof v === "function" ? v(c) : v);
function chercherCible(sel) {
  for (const s of sel || []) {
    for (const el of document.querySelectorAll(s)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden") return el;
    }
  }
  return null;
}

const zoneDefilement = () => [...document.querySelectorAll(".rp-panneau__corps, .rp-contenu, #cadre.rp-cadre--accueil")].find((z) => z.getBoundingClientRect().width > 0) || null;
/* fait défiler seulement la zone qui contient la cible (jamais la page entière) */
function amenerEnVue(el) {
  const zone = el.closest(".rp-panneau__corps, .rp-comp, .rp-contenu");
  if (!zone) return;
  const rz = zone.getBoundingClientRect(), re = el.getBoundingClientRect();
  if (re.top >= rz.top + 16 && re.bottom <= rz.bottom - 16) return;
  const decalage = re.top - rz.top - Math.max(16, (rz.height - Math.min(re.height, rz.height * 0.7)) / 2);
  zone.scrollBy({ top: decalage, behavior: MOUVEMENT_REDUIT ? "auto" : "smooth" });
}

function Tutoriel({ ctx, tuto, setTuto, setOnglet }) {
  const etapes = tuto.mode === "visite" ? ETAPES_VISITE : ETAPES_COMPLET;
  let i = tuto.index;
  while (i < etapes.length) {
    const s = etapes[i];
    if (s.fait?.(ctx) || (s.valable && !s.valable(ctx))) { i++; continue; }
    break;
  }
  const etape = etapes[i];
  useEffect(() => {
    if (i >= etapes.length) setTuto((t) => ({ ...t, actif: false, fini: t.fini || t.mode === "complet", index: 0 }));
    else if (i !== tuto.index) setTuto((t) => ({ ...t, index: i }));
  }, [i]);
  useEffect(() => { if (etape?.onglet && ctx.onglet !== etape.onglet) setOnglet(etape.onglet); }, [etape?.id]);
  const titre = etape && valeur(etape.titre, ctx);
  const texte = etape ? valeur(etape.texte, ctx) : "";
  const humeur = etape && (valeur(etape.humeur, ctx) || "neutre");
  const [lettres, setLettres] = useState(0);
  const [pret, setPret] = useState(!etape?.attente);
  useEffect(() => {
    setLettres(0); setPret(!etape?.attente);
    const t1 = etape?.attente ? setTimeout(() => setPret(true), etape.attente) : null;
    if (MOUVEMENT_REDUIT) { setLettres(9999); return () => clearTimeout(t1); }
    const id = setInterval(() => setLettres((k) => (k > 600 ? (clearInterval(id), k) : k + 2)), 18);
    if (etape) M.son("clic");
    return () => { clearInterval(id); clearTimeout(t1); };
  }, [etape?.id]);
  const refSpot = useRef(null), refBulle = useRef(null), refVoile = useRef(null), refToucher = useRef(0);
  useEffect(() => {
    if (!etape || !pret) return;
    let raf, scrolle = false, cibleAvant = null;
    const boucle = () => {
      const spot = refSpot.current, bulle = refBulle.current, voile = refVoile.current;
      if (spot && bulle && voile) {
        const cache = !!document.querySelector(VOILES);
        const el = cache ? null : chercherCible(valeur(etape.cible, ctxRef.current));
        bulle.style.visibility = cache ? "hidden" : "visible";
        const vw = window.innerWidth, vh = window.innerHeight, mobile = vw < 760;
        const bw = bulle.offsetWidth, bh = bulle.offsetHeight;
        let x, y;
        if (el) {
          if (!scrolle || el !== cibleAvant) { amenerEnVue(el); scrolle = true; cibleAvant = el; }
          const r = el.getBoundingClientRect(), pad = 7;
          const top = Math.max(4, r.top - pad), bas = Math.min(vh - 4, r.bottom + pad);
          spot.style.display = "block"; voile.style.display = "none";
          spot.style.transform = `translate(${r.left - pad}px, ${top}px)`;
          spot.style.width = `${r.width + 2 * pad}px`; spot.style.height = `${Math.max(0, bas - top)}px`;
          if (mobile) {
            x = (vw - bw) / 2;
            y = (r.top + r.height / 2) > vh * 0.5 ? 10 : vh - bh - 128;
          } else if (vh - bas >= bh + 20) { y = bas + 14; x = r.left + r.width / 2 - bw / 2; }
          else if (top >= bh + 20) { y = top - bh - 14; x = r.left + r.width / 2 - bw / 2; }
          else if (vw - r.right >= bw + 24) { x = r.right + 16; y = r.top; }
          else if (r.left >= bw + 24) { x = r.left - bw - 16; y = r.top; }
          else { x = vw - bw - 20; y = vh - bh - 20; }
        } else {
          /* voile bloquant seulement pour les bulles d'explication sans cible (bienvenue, fin) :
             si le joueur s'est éloigné de l'élément attendu, il garde la main sur tout l'écran */
          const modale = !etape.cible && !etape.fait;
          spot.style.display = "none"; voile.style.display = cache || !modale ? "none" : "block";
          bulle.classList.toggle("rp-tuto__bulle--perdu", !modale && !cache);
          x = (vw - bw) / 2; y = modale ? (mobile ? vh - bh - 128 : (vh - bh) / 2) : vh - bh - (mobile ? 128 : 24);
        }
        if (el) bulle.classList.remove("rp-tuto__bulle--perdu");
        x = Math.max(10, Math.min(vw - bw - 10, x)); y = Math.max(10, Math.min(vh - bh - 10, y));
        bulle.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
        if (cache) spot.style.display = "none";
      }
      raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [etape?.id, pret]);
  const ctxRef = useRef(ctx); ctxRef.current = ctx;
  if (!etape || !pret) return null;
  const n = etapes.length;
  const suivant = () => setTuto((t) => ({ ...t, index: i + 1 }));
  const termine = lettres >= texte.length;
  return M.ReactDOM.createPortal(
    h("div", { className: "rp-tuto" },
      h("div", { ref: refVoile, className: "rp-tuto__voile" }),
      h("div", { ref: refSpot, className: "rp-tuto__spot" }),
      h("div", { ref: refBulle, key: etape.id, className: "rp-tuto__bulle", role: "dialog", "aria-live": "polite", "aria-label": titre, onClick: () => setLettres(9999),
        /* la molette et le doigt sur la bulle font défiler l'écran du dessous */
        onWheel: (e) => zoneDefilement()?.scrollBy({ top: e.deltaY }),
        onTouchStart: (e) => { refToucher.current = e.touches[0].clientY; },
        onTouchMove: (e) => { const y = e.touches[0].clientY; zoneDefilement()?.scrollBy({ top: refToucher.current - y }); refToucher.current = y; } },
        h("div", { className: "rp-tuto__perso" }, h(Hector, { humeur, parle: !termine, taille: 78 })),
        h("div", { className: "rp-tuto__texte" },
          h("span", { className: "rp-tuto__compteur" }, tuto.mode === "visite" ? "Visite guidée" : "Tutoriel", ` · ${Math.min(i + 1, n)}/${n}`),
          h("strong", null, titre),
          h("p", null, texte.slice(0, lettres), !termine && h("span", { className: "rp-tuto__curseur" }, "▌")),
          etape.cible && h("p", { className: "rp-tuto__perdu" }, "Je ne vois pas cet élément sur cet écran. Revenez à l'onglet où nous étions, ou passez le tutoriel."),
          h("div", { className: "rp-tuto__actions" },
            etape.bouton || !etape.fait
              ? h(Bouton, { taille: "petit", onClick: (e) => { e.stopPropagation(); suivant(); }, className: "rp-tuto__suivant" }, etape.bouton || "Suivant")
              : h("span", { className: "rp-tuto__attente" }, h("i"), h("i"), h("i"), " À vous de jouer"),
            h("button", { type: "button", className: "rp-tuto__passer", onClick: (e) => { e.stopPropagation(); setTuto((t) => ({ ...t, actif: false, fini: true, index: 0 })); } }, tuto.mode === "visite" ? "Arrêter la visite" : "Passer le tutoriel"))))),
    document.getElementById("cadre") || document.body);
}
