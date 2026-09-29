import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ScrollRevealRise, type MotionDials} from '../src';
import {DialPanel} from './DialPanel';
import './scroll-reveal-rise.css';

function Demo() {
  const [mount, setMount] = useState(0);
  const [count, setCount] = useState(0);
  const [dials, setDials] = useState<MotionDials>({});
  return <main className="rise-demo">
    <header className="rise-demo-nav"><a href="./index.html">WCC / Motion Library</a><span>02 — Scroll Reveal Rise</span></header>
    <DialPanel pieceId="scroll-reveal-rise" value={dials} onChange={value => {setDials(value); setMount(value => value + 1);}} onReplay={() => setMount(value => value + 1)}/>
    <div key={mount}>
      <section className="rise-demo-hero">
        <ScrollRevealRise dials={dials}>
          <p className="rise-demo-eyebrow">A quiet entrance</p>
          <h1>Good things<br/>rise into view.</h1>
          <p className="rise-demo-intro">Small movements. A gentle finish. Content arrives as you scroll, then stays right where it belongs.</p>
        </ScrollRevealRise>
        <div className="rise-demo-actions">
          <ScrollRevealRise dials={dials} as="button">
            <button onClick={() => setCount(value => value + 1)}>Try a real button</button>
            <a className="rise-demo-secondary" href="#images">Explore the motion ↓</a>
          </ScrollRevealRise>
        </div>
        <p aria-live="polite" className="rise-demo-note">{count ? `Button activated ${count} time${count === 1 ? '' : 's'}.` : 'Use Tab to explore. Your scroll stays yours.'}</p>
      </section>
      <section id="images" className="rise-demo-section">
        <ScrollRevealRise dials={dials}><p className="rise-demo-eyebrow">01 / A little more weight</p><h2>Room to settle.</h2><p className="rise-demo-intro">Large blocks rise a little farther and land a little slower. Keep scrolling to watch the next group unfold.</p></ScrollRevealRise>
        <ScrollRevealRise dials={dials} as="image"><div className="rise-demo-block rise-demo-large" role="img" aria-label="Large sage green placeholder"><span>Image preset</span><strong>Take your time.</strong></div></ScrollRevealRise>
      </section>
      <section className="rise-demo-section">
        <ScrollRevealRise dials={dials}><p className="rise-demo-eyebrow">02 / Better together</p><h2>One smooth unfolding.</h2></ScrollRevealRise>
        <div className="rise-demo-grid">
          <ScrollRevealRise dials={dials} as="image">
            {['A fresh start.', 'A steady rhythm.', 'A little momentum.'].map((label, index) => <div key={label} className={`rise-demo-block rise-demo-tile rise-demo-color-${index}`} role="img" aria-label={`${label} colored placeholder`}><span>0{index + 1}</span><strong>{label}</strong></div>)}
          </ScrollRevealRise>
        </div>
      </section>
      <section className="rise-demo-section">
        <ScrollRevealRise dials={dials}><p className="rise-demo-eyebrow">03 / A short cascade</p><h2>Even a long list<br/>keeps moving.</h2></ScrollRevealRise>
        <div className="rise-demo-small-grid">
          <ScrollRevealRise dials={dials}>{Array.from({length: 18}, (_, i) => <div className="rise-demo-small" key={i}><span>{String(i + 1).padStart(2, '0')}</span></div>)}</ScrollRevealRise>
        </div>
      </section>
      <section className="rise-demo-section rise-demo-repeat">
        <ScrollRevealRise dials={dials} once={false}><p className="rise-demo-eyebrow">04 / Optional replay</p><h2>A second look.</h2><p className="rise-demo-intro">This section uses once=false. Scroll it completely out of view and return to see it rise again.</p></ScrollRevealRise>
      </section>
    </div>
    <footer><p>Soft motion. Native scrolling. Fully usable with reduced motion.</p><button onClick={() => setMount(value => value + 1)}>Remount all reveals</button><a href="#top">Back to top ↑</a></footer>
  </main>;
}

createRoot(document.getElementById('root')!).render(<Demo/>);
