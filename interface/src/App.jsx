import { useState, useEffect, useRef } from 'react';
import { useSensors, useClock } from './sensors.js';
import { COMFORT, idealSetpoint, effectiveSetpoint, autoAction, safetyAlert } from './comfort.js';

const SETBACK_DELAY_S = 10;    // délai sans présence avant setback (court pour la démo)

const ACTIONS = {
  cool: 'Refroidissement',
  heat: 'Chauffage',
  idle: 'Température atteinte',
};

export default function App() {
  const [adjust, setAdjust] = useState(0);
  const [presence, setPresence] = useState(true);
  const [lastPresence, setLastPresence] = useState(Date.now());
  const now = useClock();

  useEffect(() => {
    if (presence) setLastPresence(Date.now());
  }, [presence, now]);

  const setback = !presence && (now - lastPresence) / 1000 > SETBACK_DELAY_S;

  // La consigne dépend de tOut, et la simulation dépend de la consigne : on passe par une ref
  const loop = useRef({ sp: COMFORT.ideal, action: 'idle' });
  const { tIn, tOut, setTIn, setTOut } = useSensors(loop.current.sp, loop.current.action);
  const ideal = idealSetpoint(tOut);
  const sp = effectiveSetpoint(tOut, adjust, setback);
  const action = autoAction(tIn, sp);
  loop.current = { sp, action };
  const alert = safetyAlert(tIn);

  const step = d => setAdjust(a => Math.max(-COMFORT.tolerance, Math.min(COMFORT.tolerance, a + d)));

  const presenceBadge = presence
    ? { text: '● Présence', cls: 'badge present' }
    : setback
      ? { text: '○ Setback', cls: 'badge setback' }
      : { text: '○ Absent', cls: 'badge' };

  const raw = {
    temp_int: +tIn.toFixed(2),
    temp_ext: +tOut.toFixed(2),
    presence,
    setback,
    consigne_ideale: ideal,
    ajustement: adjust,
    consigne_effective: sp,
    action,
    alerte: alert,
  };

  return (
    <>
      <div className={'screen' + (setback ? ' setback-on' : '')}>
        <div className="top">
          <span>{now.toTimeString().slice(0, 5)}</span>
          <span className={presenceBadge.cls}>{presenceBadge.text}</span>
          <span>Mode Auto</span>
        </div>

        <div className="main">
          <div className="card">
            <span className="label">Intérieur</span>
            <span className="big">{tIn.toFixed(1)}°</span>
            <span className="small">Extérieur <b>{tOut.toFixed(1)}°</b></span>
          </div>
          <div className="card">
            <span className="label">{setback ? 'Consigne (setback)' : 'Consigne'}</span>
            <div className="setpoint">
              <button onClick={() => step(-0.5)} disabled={adjust <= -COMFORT.tolerance}>−</button>
              <span className="big">{sp.toFixed(1)}°</span>
              <button onClick={() => step(0.5)} disabled={adjust >= COMFORT.tolerance}>+</button>
            </div>
            <span className="small">
              Idéal {ideal.toFixed(1)}° · {adjust >= 0 ? '+' : ''}{adjust.toFixed(1)}° (±{COMFORT.tolerance})
            </span>
          </div>
        </div>

        <div className={'status' + (alert ? ' alert' : '')}>
          {alert ? `⚠ ${alert} : ${tIn.toFixed(1)}°` : ACTIONS[action]}
        </div>
      </div>

      <div className="debug">
        <b>Capteurs (simulation)</b>
        <pre>{JSON.stringify(raw, null, 2)}</pre>
        <label>
          Temp. intérieure : {tIn.toFixed(1)}°
          <input type="range" min="10" max="35" step="0.5" value={tIn}
            onChange={e => setTIn(+e.target.value)} />
        </label>
        <label>
          Temp. extérieure : {tOut.toFixed(0)}°
          <input type="range" min="-10" max="40" step="1" value={tOut}
            onChange={e => setTOut(+e.target.value)} />
        </label>
        <button onClick={() => setPresence(p => !p)}>Basculer présence</button>
      </div>
    </>
  );
}
