/* global React, ReactDOM */
// WSET Flashcard Maker — Icons + small components

const Icon = ({ name, size = 18 }) => {
  const s = size;
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'chevron-left':
      return <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}><polyline points="15 6 9 12 15 18"/></svg>;
    case 'chevron-right':
      return <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}><polyline points="9 6 15 12 9 18"/></svg>;
    case 'restart':
      return <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 3 3 8 8 8"/></svg>;
    case 'edit':
      return <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}><path d="M4 20h4L20 8l-4-4L4 16v4z"/></svg>;
    case 'play':
      return <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}><polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none"/></svg>;
    case 'plus':
      return <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case 'trash':
      return <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
    case 'save':
      return <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
    case 'download':
      return <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
    case 'library':
      return <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
    case 'grip':
      return <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}><circle cx="9" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1" fill="currentColor" stroke="none"/></svg>;
    case 'upload':
      return <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
    case 'check':
      return <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}><polyline points="20 6 9 17 4 12"/></svg>;
    case 'copy':
      return <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
    default: return null;
  }
};

const Toast = ({ message, onClose }) => {
  React.useEffect(() => {
    const t = setTimeout(onClose, 2600);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="ok"><Icon name="check" size={16}/></span>
      {message}
    </div>
  );
};

/* Adaptive font size hook — shrinks until it fits OR hits minimum */
function useAdaptiveFont(ref, text, { max = 32, min = 16, step = 1 } = {}) {
  const [size, setSize] = React.useState(max);
  const [scrolls, setScrolls] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // reset to max, then shrink
    let s = max;
    el.style.fontSize = s + 'px';
    // Measure parent scroll container (answer-scroll)
    const container = el.parentElement;
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

Object.assign(window, { Icon, Toast, useAdaptiveFont });
