// Calcul de la consigne de confort pour personnes âgées / fragiles (EHPAD)
// Valeurs par défaut à valider avec l'équipe soignante.

export const COMFORT = {
  ideal: 22,          // °C, consigne de référence
  tolerance: 1.5,     // °C, ajustement autorisé autour de la consigne idéale
  maxDeltaOut: 7,     // °C, écart max intérieur/extérieur en été (éviter le choc thermique)
  summerMax: 25,      // °C, plafond de la consigne en été (canicule)
  setbackOffset: 2,   // °C, décalage en absence (limité pour un retour rapide au confort)
  safeMin: 19,        // °C, en dessous : risque d'hypothermie
  safeMax: 26,        // °C, au dessus : risque de déshydratation / coup de chaleur
  deadband: 0.5,      // °C, zone neutre du mode auto
};

// Consigne idéale compensée par la température extérieure :
// en forte chaleur on remonte la consigne pour limiter l'écart avec l'extérieur.
export function idealSetpoint(tOut) {
  const compensated = Math.max(COMFORT.ideal, tOut - COMFORT.maxDeltaOut);
  return Math.min(compensated, COMFORT.summerMax);
}

// Consigne effective = idéale + ajustement résident (±tolérance), puis setback éventuel,
// toujours bornée à la plage de sécurité.
export function effectiveSetpoint(tOut, adjust, setback) {
  const ideal = idealSetpoint(tOut);
  let sp = ideal + clamp(adjust, -COMFORT.tolerance, COMFORT.tolerance);
  if (setback) {
    // Économie dans le sens de la saison : moins de froid en été, moins de chaud en hiver
    sp += tOut > ideal ? COMFORT.setbackOffset : -COMFORT.setbackOffset;
  }
  return clamp(sp, COMFORT.safeMin, COMFORT.safeMax);
}

// Mode auto : la clim choisit chauffage / refroidissement selon l'écart à la consigne
export function autoAction(tIn, sp) {
  if (tIn > sp + COMFORT.deadband) return 'cool';
  if (tIn < sp - COMFORT.deadband) return 'heat';
  return 'idle';
}

export function safetyAlert(tIn) {
  if (tIn > COMFORT.safeMax) return 'Trop chaud';
  if (tIn < COMFORT.safeMin) return 'Trop froid';
  return null;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}
