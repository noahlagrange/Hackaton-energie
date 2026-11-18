import { useState, useEffect, useRef } from 'react';

// Simulation des capteurs (à remplacer par la vraie source : API, MQTT, WebSocket…)
// `action` : 'heat' | 'cool' | 'idle', la clim pousse tIn vers `target` sauf en idle.
export function useSensors(target, action) {
  const [tIn, setTIn] = useState(24.5);
  const [tOut, setTOut] = useState(31.0);
  const ref = useRef({ target, action, tOut });
  ref.current = { target, action, tOut };

  useEffect(() => {
    const id = setInterval(() => {
      const { target, action, tOut } = ref.current;
      setTIn(t => {
        const pull = action === 'idle' ? (tOut - t) * 0.005 : (target - t) * 0.03;
        return t + pull + (Math.random() - 0.5) * 0.05;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return { tIn, tOut, setTIn, setTOut };
}

export function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
