import { useState, useRef, useEffect } from 'react'
import Icon from './Icon.jsx'
import { useAdaptiveFont } from '../hooks/useAdaptiveFont.js'

const Flashcard = ({ card, index, total, side, onFlip, variant }) => {
  const answerRef = useRef(null);
  const { scrolls } = useAdaptiveFont(answerRef, card.back, { max: 30, min: 16, step: 1 });

  const handleKey = (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onFlip(); }
  };

  const flipped = side === 'back';

  return (
    <>
      <div className="fc-top">
        <span className="count">Card {index + 1} of {total}</span>
        <span className="side">{flipped ? 'Answer' : 'Question'}</span>
      </div>
      <div className="fc-progress" aria-hidden="true">
        <div className="fc-progress__bar" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      <div className={`fc-flip ${flipped ? 'flipped' : ''} ${variant ? 'variant-' + variant : ''}`}>
        <div className="fc-flip__inner">
          <div
            className="fc-face fc-face--front"
            role="button"
            tabIndex={flipped ? -1 : 0}
            aria-label={`Question ${index + 1} of ${total}. ${card.front}. Press to reveal answer.`}
            aria-pressed={flipped}
            aria-hidden={flipped}
            onClick={onFlip}
            onKeyDown={handleKey}
          >
            <div className="label">Question</div>
            <div className="q-text" style={{ fontSize: 'clamp(20px, 2.4vw, 28px)' }}>
              {card.front}
            </div>
            <div className="tap-hint">Tap or press <span className="kbd">Space</span> to reveal answer</div>
          </div>

          <div
            className="fc-face fc-face--back"
            role="button"
            tabIndex={flipped ? 0 : -1}
            aria-label={`Answer: ${card.back}. Press to flip back.`}
            aria-pressed={flipped}
            aria-hidden={!flipped}
            onClick={onFlip}
            onKeyDown={handleKey}
          >
            <div className={`answer-scroll ${scrolls ? 'scrolls' : ''}`}>
              <div className="label">Answer</div>
              <div className="a-text" ref={answerRef}>{card.back}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const TitleCard = ({ set, onStart }) => (
  <div
    className="title-card"
    style={set.hero ? { backgroundImage: `url(${set.hero})` } : { background: 'var(--wset-heritage-blue)' }}
  >
    <div className="title-card__box">
      <div className="title-card__kicker">Revision flashcards</div>
      <h2 className="title-card__title">{set.title || 'Untitled set'}</h2>
      <p className="title-card__sub">{set.instructions}</p>
      <button className="title-card__start" onClick={onStart}>
        Start <Icon name="chevron-right" size={16}/>
      </button>
      <div className="title-card__tip">
        Tip: use <span className="kbd">←</span> <span className="kbd">→</span> to navigate
        and <span className="kbd">Space</span> to flip.
      </div>
    </div>
  </div>
);

const DoneCard = ({ onRestart }) => (
  <div className="done-card">
    <div>
      <h3>Well done — you've reviewed every card.</h3>
      <p>Seek more. Practice makes perfect.</p>
      <div className="actions">
        <button className="title-card__start" onClick={onRestart}>
          <Icon name="restart" size={16}/> Restart deck
        </button>
      </div>
    </div>
  </div>
);

const PlayerControls = ({ index, total, onPrev, onNext, onRestart, atTitle, atDone }) => {
  if (atTitle || atDone) return null;
  return (
    <div className="fc-controls">
      <button className="fc-btn" onClick={onPrev} disabled={index === 0} aria-label="Previous card">
        <Icon name="chevron-left" size={16}/> Previous
      </button>
      <div className="spacer" />
      <button className="fc-btn--ghost" onClick={onRestart} aria-label="Restart deck">
        <Icon name="restart" size={16}/> Restart
      </button>
      <div className="spacer" />
      <button className="fc-btn" onClick={onNext} aria-label={index === total - 1 ? 'Finish' : 'Next card'}>
        {index === total - 1 ? 'Finish' : 'Next'} <Icon name="chevron-right" size={16}/>
      </button>
    </div>
  );
};

const Player = ({ set, variant = 'default', framed = true, onExit, initialPos = -1 }) => {
  const [pos, setPos] = useState(initialPos);
  const [side, setSide] = useState('front');
  const total = set.cards.length;
  const atTitle = pos === -1;
  const atDone = pos >= total;

  const goTo = (i) => { setPos(i); setSide('front'); };
  const onNext = () => goTo(Math.min(pos + 1, total));
  const onPrev = () => goTo(Math.max(pos - 1, 0));
  const onRestart = () => goTo(-1);
  const onFlip = () => setSide(s => s === 'front' ? 'back' : 'front');

  useEffect(() => {
    const h = (e) => {
      if (e.target.matches('input, textarea')) return;
      if (atTitle) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(0); }
        return;
      }
      if (e.key === 'ArrowRight') { e.preventDefault(); onNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev(); }
      if (e.key === ' ') { e.preventDefault(); if (!atDone) onFlip(); }
      if (e.key === 'Escape' && onExit) onExit();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [pos, side, atTitle, atDone]);

  return (
    <div className={`stage ${!framed ? 'stage--bare' : ''}`}>
      <div className="stage__frame">
        {framed && <div className="stage__ribbon">Preview</div>}
        {atTitle && <TitleCard set={set} onStart={() => goTo(0)} />}
        {!atTitle && !atDone && (
          <Flashcard
            card={set.cards[pos]}
            index={pos}
            total={total}
            side={side}
            onFlip={onFlip}
            variant={variant}
          />
        )}
        {atDone && <DoneCard onRestart={onRestart} />}
        <PlayerControls
          index={pos}
          total={total}
          onPrev={onPrev}
          onNext={onNext}
          onRestart={onRestart}
          atTitle={atTitle}
          atDone={atDone}
        />
      </div>
    </div>
  );
};

export default Player;
