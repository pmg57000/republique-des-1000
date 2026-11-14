/* ==== Refonte « La République des 1 000 » ====
   Pont vers le moteur d'origine : on capture les fonctions du bundle (noms minifiés)
   sous des noms lisibles, sans rien modifier de la simulation. */
const __RP_M = {
  React: be, ReactDOM: Uh, createRoot: _5.createRoot,
  /* moteur : partie, réformes, études */
  nouvellePartie: Yx, statutLoi: Ho, apercuLoi: Qx, commanderEtude: sh, abandonnerEtude: ah,
  peutEtudier: nm, etude: Fo, etudesEnCours: ic, rapportsPrets: fr, etudeRequise: mr, limitesEtudes: Ds,
  deposer: Zp, promulguer: uh, ouvrirSession: Xp, clore: ac,
  /* Assemblée */
  voter: tm, etatVote: pr, infoNego: wp, negocier: Jp, propositionsAmendement: Wp, amender: em, art493: Kx,
  continuer: sc, retirer: lh, demissionCensure: oh, dissolutionCensure: eh,
  /* décisions du bilan */
  choixEvenement: Zx, decisionMES: wx,
  /* régimes, gouvernement */
  decrets: Kt, pleinsPouvoirs: it, pmRequis: ot, matignonActif: Wa, pmProfil: ur, regimes: we, regimeDe: ft,
  allie: Ns, noteMatignon: lm, lignesBudget: Ss,
  /* données */
  info: gt, libTour: Be, lois: de, catalogue: Zi, ministeres: Po, partis: ae, groupes: te,
  scenarios: OA, scenariosParId: za, constantes: mt, params: q, figures: l5, categoriesEvt: dN,
  resumeSauvegarde: wN, premiumOk: bh,
  /* stockage (mêmes clés que la version précédente : les sauvegardes sont reprises) */
  lire: Ri, ecrire: qi, effacer: gh, CLE: yc, CLE_REPRISE: Xm, VERSION: tc,
  /* son */
  son: pi, sonEtat: rc, sonAbonner: oc, sonsHook: JN,
  /* formats */
  nb: D, signe: lt, pct: Wt, euros: Gi, impact: va, meur: Ui, effetTexte: gr, effetDelai: qh, titrePresse: d5, montant: Ke,
  /* écrans d'origine réutilisés et rhabillés */
  Icone: Ae, Sceau: xa, Une: $m, FinMandat: Bm, Reglages: s4, Aide: M5, Briefing: Hm, Premium: T5,
  AlerteDemission: S5, NominationPM: Er, Gouvernement: Cm, Population: qm, Indicateurs: jm, PanneauPM: Ec,
  PleinsPouvoirs: bc, Plan: xc, Defi: Kh, Echeances: Wh, Boussole: Xh, BoutonSon: Qo, RegimeResume: Zh,
  ReactionGouvernement: c5, NoteCohabitation: Ac, Statuts: e5, Victoires: t5, astuce: L5,
  /* nouveautés de la version de Steven : explications, glossaire, doctrines, pactes de coalition */
  fichesIndicateurs: kN, glossaire: X3, glossaireMotifs: Z3, doctrines: EN, profilsGroupes: Y3,
  pactes: Yp, pactesParams: di, libPactes: rN, argent: ht,
};
