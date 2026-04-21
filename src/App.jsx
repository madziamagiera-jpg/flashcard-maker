import { useState } from 'react'
import Icon from './components/Icon.jsx'
import Toast from './components/Toast.jsx'
import Player from './components/Player.jsx'
import EditorPanel from './components/Editor.jsx'
import { exportScorm } from './utils/scorm.js'

const STORAGE_KEY = 'wset_flashcard_sets_v1';
const TWEAKS_KEY  = 'wset_flashcard_tweaks_v1';

const TEMPLATE_SET = {
  id: 'template',
  title: "California's grape varieties",
  instructions: "Review important facts about California's major grape varieties. Tap a card to reveal the answer, then use the arrows to move between questions.",
  hero: '/assets/default-hero.jpeg',
  updated: Date.now(),
  cards: [
    { id: 't1', front: 'Which region of California produces many of its highest-quality Cabernet Sauvignon wines?', back: 'The North Coast' },
    { id: 't2', front: 'How is the style of Cabernet Sauvignon affected by different growing conditions in California?', back: 'Vineyards with moderating influences, such as proximity to the coast or higher altitude typically produce wines with fresher black-fruit and some herbal flavours, less body and lower alcohol. By contrast, grapes that are grown in warmer regions or left on the vine for extended periods can develop very ripe, concentrated flavours, resulting in full-bodied wines with high alcohol levels.' },
    { id: 't3', front: 'Where are the grapes for high-quality Pinot Noir typically grown in California?', back: 'High-quality Pinot Noir is typically grown in regions with an intermediate climate, such as Santa Barbara, Monterey or western Sonoma County, where vineyards benefit from the cooling influence of the Pacific Ocean, higher altitude, or both.' },
    { id: 't4', front: "How does Zinfandel's tendency to ripen unevenly affect the grapes at harvest?", back: "Zinfandel's tendency to ripen unevenly means that harvested fruit can include both fully ripe and less ripe grapes. In warmer areas, or if picked late, some grapes may raisin on the vine, leading to wines with concentrated, even cooked fruit, flavours and high alcohol levels. However, when picked earlier, Zinfandel can produce wines with fresher flavours, higher acidity and medium levels of alcohol." },
    { id: 't5', front: 'What are the typical structural characteristics of a high-quality California Zinfandel?', back: 'High-quality California Zinfandel often has medium(+) acidity, medium to full body, medium(+) levels of ripe tannins and flavours ranging from raspberry to blueberry and blackberry.' },
    { id: 't6', front: 'Which regions of California are known for high-quality Merlot wines?', back: 'Higher-quality Merlots come from cooler sites in Monterey and some of the North Coast regions such as Napa Valley and Sonoma County. These deeply coloured wines have smooth tannins, a full body and flavours of blackberry and black plum.' },
    { id: 't7', front: 'Which grape variety has its largest global plantings in California?', back: 'California has the largest global plantings of Petite Sirah (also called Durif) which thrives in warm regions. It produces wines with black-fruit flavours and high levels of tannins and acidity.' },
    { id: 't8', front: 'Where are highest-quality vineyard sites for Chardonnay typically located in California?', back: 'The highest-quality vineyard sites for Chardonnay are typically located near the coast or benefit from coastal influence, for example in Santa Barbara, Monterey and Sonoma County.' },
    { id: 't9', front: 'Where is Sauvignon Blanc planted in California?', back: 'Sauvignon Blanc is grown in all winemaking regions of California. High-quality examples come from a range of locations, including Napa, Sonoma and Santa Barbara. High-volume, inexpensive Sauvignon Blanc wines are commonly produced in hotter regions such as the Central Valley, as well as in some cooler coastal areas such as Monterey.' },
  ],
};

function newBlankSet() {
  return {
    id: 's' + Date.now(),
    title: 'Untitled flashcard set',
    instructions: 'Tap a card to reveal the answer, then use the arrows to move between questions.',
    hero: '',
    updated: Date.now(),
    cards: [{ id: 'c' + Date.now(), front: '', back: '' }],
  };
}

function loadSets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveSets(sets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

// -------- Library screen --------
const Library = ({ sets, onOpen, onNew, onDuplicate, onDelete, onOpenTemplate }) => (
  <div className="library">
    <div className="library__header">
      <div>
        <h1>Flashcard maker</h1>
        <p>Design interactive flashcards for the WSET Online Classroom. Export as SCORM for Canvas.</p>
      </div>
      <button className="iconbtn solid" onClick={onNew}>
        <Icon name="plus" size={14}/> New set
      </button>
    </div>

    <div className="set-grid">
      <div className="set-card new" onClick={onNew} role="button" tabIndex={0}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onNew()}>
        <div>
          <div className="plus">+</div>
          Start a new set
          <div style={{color:'#6b7280', fontWeight:400, fontSize:12, marginTop:6}}>Blank flashcards</div>
        </div>
      </div>

      <div className="set-card" style={{borderColor:'var(--wset-heritage-blue)'}}>
        <div className="set-card__thumb" style={{ backgroundImage: `url(/assets/default-hero.jpeg)` }}>
          <span className="chip-count">Template · 9 cards</span>
        </div>
        <div className="set-card__body">
          <h3>{TEMPLATE_SET.title}</h3>
          <div className="meta">Read-only template · use as a starting point</div>
          <div className="set-card__actions">
            <button className="primary" onClick={onOpenTemplate}>
              <Icon name="copy" size={12}/> Use template
            </button>
          </div>
        </div>
      </div>

      {sets.map(s => (
        <div key={s.id} className="set-card">
          <div
            className="set-card__thumb"
            style={s.hero
              ? { backgroundImage: `url(${s.hero})` }
              : { background: 'var(--wset-heritage-blue)' }}
          >
            <span className="chip-count">{s.cards.length} card{s.cards.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="set-card__body">
            <h3>{s.title || 'Untitled set'}</h3>
            <div className="meta">Edited {new Date(s.updated).toLocaleDateString()}</div>
            <div className="set-card__actions">
              <button className="primary" onClick={() => onOpen(s.id)}>
                <Icon name="edit" size={12}/> Open
              </button>
              <button onClick={() => onDuplicate(s.id)}>
                <Icon name="copy" size={12}/> Duplicate
              </button>
              <button className="danger" onClick={() => onDelete(s.id)}>
                <Icon name="trash" size={12}/> Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// -------- Tweaks panel --------
const TweaksPanel = ({ tweaks, setTweaks, visible }) => {
  if (!visible) return null;
  const set = (patch) => setTweaks({ ...tweaks, ...patch });
  return (
    <div className="tweaks">
      <h5>Card style</h5>
      <div className="t-row">
        <label>Visual direction</label>
        <div className="variant-group">
          {[
            { k: 'default',   label: 'Classic'   },
            { k: 'editorial', label: 'Editorial' },
            { k: 'label',     label: 'Label'     },
          ].map(v => (
            <button
              key={v.k}
              className={tweaks.variant === v.k ? 'active' : ''}
              onClick={() => set({ variant: v.k })}
            >{v.label}</button>
          ))}
        </div>
      </div>
      <div style={{fontSize:11, color:'#6b7280', marginTop:8}}>
        Designers pick one style per set. Size, animation, and layout are locked.
      </div>
    </div>
  );
};

// -------- App --------
const App = () => {
  const [sets, setSetsState]   = useState(() => loadSets() || []);
  const [screen, setScreen]    = useState('library');   // library | editor
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft]      = useState(null);
  const [dirty, setDirty]      = useState(false);
  const [selected, setSelected] = useState(0);
  const [mode, setMode]        = useState('edit');      // edit | preview
  const [toast, setToast]      = useState(null);
  const [tweaksVisible, setTweaksVisible] = useState(false);
  const [tweaks, setTweaksState] = useState(() => {
    try { return { variant: 'default', ...(JSON.parse(localStorage.getItem(TWEAKS_KEY) || '{}')) }; }
    catch { return { variant: 'default' }; }
  });

  const setTweaks = (t) => {
    setTweaksState(t);
    localStorage.setItem(TWEAKS_KEY, JSON.stringify(t));
  };

  const persist = (nextSets) => { setSetsState(nextSets); saveSets(nextSets); };
  const showToast = (m) => setToast(m);

  // --- Library actions ---
  const openNew = () => {
    const s = newBlankSet();
    setDraft(s); setActiveId(null); setDirty(true); setSelected(0);
    setScreen('editor'); setMode('edit');
  };
  const openTemplate = () => {
    const copy = {
      ...TEMPLATE_SET,
      id: 's' + Date.now(),
      title: TEMPLATE_SET.title + ' (copy)',
      updated: Date.now(),
    };
    setDraft(copy); setActiveId(null); setDirty(true); setSelected(0);
    setScreen('editor'); setMode('edit');
  };
  const openExisting = (id) => {
    const s = sets.find(x => x.id === id);
    if (!s) return;
    setDraft(JSON.parse(JSON.stringify(s))); setActiveId(id); setDirty(false);
    setSelected(0); setScreen('editor'); setMode('edit');
  };
  const duplicate = (id) => {
    const s = sets.find(x => x.id === id);
    if (!s) return;
    const copy = { ...JSON.parse(JSON.stringify(s)), id: 's' + Date.now(), title: s.title + ' (copy)', updated: Date.now() };
    persist([...sets, copy]);
    showToast('Set duplicated');
  };
  const del = (id) => {
    if (!confirm('Delete this set? This cannot be undone.')) return;
    persist(sets.filter(x => x.id !== id));
    showToast('Set deleted');
  };

  // --- Editor actions ---
  const update = (patch) => {
    setDraft(d => ({ ...d, ...patch }));
    setDirty(true);
  };
  const save = () => {
    if (!draft) return;
    const stamped = { ...draft, updated: Date.now() };
    const next = activeId
      ? sets.map(s => s.id === activeId ? stamped : s)
      : [...sets, stamped];
    if (!activeId) setActiveId(stamped.id);
    persist(next);
    setDraft(stamped);
    setDirty(false);
    showToast(activeId ? 'Saved' : 'Set saved to library');
  };
  const exitToLibrary = () => {
    if (dirty && !confirm('You have unsaved changes. Leave without saving?')) return;
    setScreen('library'); setDraft(null); setActiveId(null); setDirty(false);
  };
  const onExportScorm = async () => {
    if (!draft) return;
    await exportScorm(draft, tweaks.variant);
    showToast('SCORM package downloaded');
  };

  const currentSetLabel = draft ? (draft.title || 'Untitled set') : '';

  return (
    <div className={`app ${mode === 'preview' ? 'student-mode' : ''}`}>
      <header className="topbar">
        <div className="topbar__brand">
          <img src="/assets/WSET_Logo_Heritage_Blue.png" alt="WSET" style={{filter:'brightness(0) invert(1)'}}/>
          <span>/</span>
          <span className="topbar__title">Flashcard maker</span>
        </div>

        {screen === 'editor' && (
          <>
            <button className="iconbtn" onClick={exitToLibrary} title="Back to library">
              <Icon name="library" size={14}/> Library
            </button>
            <div className={`topbar__set ${dirty ? 'dirty' : ''}`}>
              <span className="dot"/>
              <strong>{currentSetLabel}</strong>
              <span style={{opacity:.7}}>{dirty ? '· unsaved' : '· saved'}</span>
            </div>
          </>
        )}

        <div className="topbar__spacer"/>

        {screen === 'editor' && (
          <>
            <div className="modeswitch" role="tablist" aria-label="Mode">
              <button
                role="tab"
                aria-selected={mode === 'edit'}
                className={mode === 'edit' ? 'active' : ''}
                onClick={() => setMode('edit')}
              ><Icon name="edit" size={12}/> Edit</button>
              <button
                role="tab"
                aria-selected={mode === 'preview'}
                className={mode === 'preview' ? 'active' : ''}
                onClick={() => setMode('preview')}
              ><Icon name="play" size={12}/> Preview</button>
            </div>
            <button
              className={`iconbtn ${tweaksVisible ? 'active' : ''}`}
              onClick={() => setTweaksVisible(v => !v)}
              title="Card style"
              aria-pressed={tweaksVisible}
            >
              <Icon name="sliders" size={14}/> Style
            </button>
            <button className="iconbtn" onClick={save}>
              <Icon name="save" size={14}/> Save
            </button>
            <button className="iconbtn solid" onClick={onExportScorm} disabled={!draft}>
              <Icon name="download" size={14}/> Export SCORM
            </button>
          </>
        )}
      </header>

      {screen === 'library' && (
        <Library
          sets={sets}
          onOpen={openExisting}
          onNew={openNew}
          onDuplicate={duplicate}
          onDelete={del}
          onOpenTemplate={openTemplate}
        />
      )}

      {screen === 'editor' && draft && (
        <div className="editor">
          {mode === 'edit' && (
            <EditorPanel
              set={draft}
              update={update}
              selected={selected}
              setSelected={setSelected}
            />
          )}
          <Player
            key={mode}
            set={draft}
            variant={tweaks.variant}
            framed={mode === 'edit'}
            initialPos={mode === 'edit' ? selected : -1}
          />
        </div>
      )}

      <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} visible={tweaksVisible}/>
      {toast && <Toast message={toast} onClose={() => setToast(null)}/>}
    </div>
  );
};

export default App;
