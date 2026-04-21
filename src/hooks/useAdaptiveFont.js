import { useState, useLayoutEffect } from 'react'

export function useAdaptiveFont(ref, text, { max = 32, min = 16, step = 1 } = {}) {
  const [size, setSize] = useState(max);
  const [scrolls, setScrolls] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const container = el.parentElement;

    let s = max;
    el.style.fontSize = s + 'px';

    const fits = () =>
      container.scrollHeight <= container.clientHeight + 1 &&
      el.scrollWidth <= container.clientWidth + 1;

    while (!fits() && s > min) {
      s -= step;
      el.style.fontSize = s + 'px';
    }

    setSize(s);
    setScrolls(!fits() && s === min);
  }, [text, ref, max, min, step]);

  return { size, scrolls };
}
