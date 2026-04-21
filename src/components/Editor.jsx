import { useState, useRef } from 'react'
import Icon from './Icon.jsx'

const DetailsTab = ({ set, update }) => {
  const fileInput = useRef(null);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => update({ hero: r.result });
    r.readAsDataURL(f);
  };

  return (
    <div className="panel__body">
      <div className="field">
        <label>Set title</label>
        <input
          type="text"
          value={set.title}
          onChange={e => update({ title: e.target.value })}
        />
        <div className="hint">Appears on the title card.</div>
      </div>
      <div className="field">
        <label>Kicker / instructions</label>
        <textarea
          rows={3}
          value={set.instructions}
          onChange={e => update({ instructions: e.target.value })}
        />
        <div className="hint">A short intro shown on the title card.</div>
      </div>
      <div className="field">
        <label>Hero image</label>
        <div className="hero-upload">
          {set.hero
            ? <img src={set.hero} alt="Hero preview"/>
            : <div className="hero-placeholder">Upload a hero image (16:9 recommended)</div>}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            onChange={onFile}
            aria-label="Upload hero image"
          />
        </div>
        <div className="hero-actions">
          <button className="mini" onClick={() => fileInput.current?.click()}>
            <Icon name="upload" size={12}/> {set.hero ? 'Replace' : 'Upload'}
          </button>
          {set.hero && (
            <button className="mini" onClick={() => update({ hero: '' })}>Remove</button>
          )}
        </div>
      </div>
    </div>
  );
};

const CardsTab = ({ set, update, selected, setSelected }) => {
  const addCard = () => {
    const cards = [...set.cards, { id: 'c' + Date.now(), front: '', back: '' }];
    update({ cards });
    setSelected(cards.length - 1);
  };

  const delCard = (i) => {
    if (set.cards.length <= 1) return;
    const cards = set.cards.filter((_, k) => k !== i);
    update({ cards });
    setSelected(Math.min(selected, cards.length - 1));
  };

  const editCard = (i, patch) => {
    const cards = set.cards.map((c, k) => k === i ? { ...c, ...patch } : c);
    update({ cards });
  };

  const move = (from, to) => {
    if (to < 0 || to >= set.cards.length) return;
    const cards = [...set.cards];
    const [m] = cards.splice(from, 1);
    cards.splice(to, 0, m);
    update({ cards });
    setSelected(to);
  };

  return (
    <div className="panel__body">
      <div className="cardlist-header">
        <h4>Cards</h4>
        <span className="count">{set.cards.length} total</span>
      </div>

      {set.cards.map((c, i) => (
        <div key={c.id} className={`card-item ${selected === i ? 'selected' : ''}`}>
          <div className="card-item__head" onClick={() => setSelected(i)}>
            <span className="num">{String(i + 1).padStart(2, '0')}</span>
            <span className="qpreview">
              {c.front || <em style={{color:'#9ca3af'}}>Untitled question</em>}
            </span>
            <button
              className="grip"
              title="Move up"
              onClick={e => { e.stopPropagation(); move(i, i - 1); }}
              aria-label="Move up"
            >↑</button>
            <button
              className="grip"
              title="Move down"
              onClick={e => { e.stopPropagation(); move(i, i + 1); }}
              aria-label="Move down"
            >↓</button>
            <button
              className="del"
              onClick={e => { e.stopPropagation(); delCard(i); }}
              disabled={set.cards.length <= 1}
              aria-label="Delete card"
            >
              <Icon name="trash" size={14}/>
            </button>
          </div>
          <div className="card-item__body">
            <div className="field">
              <label>Question (front)</label>
              <textarea
                rows={2}
                value={c.front}
                onChange={e => editCard(i, { front: e.target.value })}
              />
            </div>
            <div className="field" style={{marginBottom: 0}}>
              <label>Answer (back)</label>
              <textarea
                rows={4}
                value={c.back}
                onChange={e => editCard(i, { back: e.target.value })}
              />
              <div className="hint">
                Long answers auto-shrink; if they can't meet 16px minimum, a scrollbar appears.
              </div>
            </div>
          </div>
        </div>
      ))}

      <button className="btn-add-card" onClick={addCard}>
        <Icon name="plus" size={14}/> Add a card
      </button>
    </div>
  );
};

const EditorPanel = ({ set, update, selected, setSelected }) => {
  const [tab, setTab] = useState('cards');

  return (
    <aside className="panel" aria-label="Editor panel">
      <div className="panel__tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'details'}
          className={tab === 'details' ? 'active' : ''}
          onClick={() => setTab('details')}
        >Title & hero</button>
        <button
          role="tab"
          aria-selected={tab === 'cards'}
          className={tab === 'cards' ? 'active' : ''}
          onClick={() => setTab('cards')}
        >Cards</button>
      </div>
      {tab === 'details' && <DetailsTab set={set} update={update}/>}
      {tab === 'cards' && (
        <CardsTab set={set} update={update} selected={selected} setSelected={setSelected}/>
      )}
    </aside>
  );
};

export default EditorPanel;
