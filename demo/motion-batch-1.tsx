import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {batchMotion, Accordion, CountUp, CtaPills, Float, HoverLift, HoverTilt, ImageHoverZoom, Marquee, ScrollFocus, ScrollRevealRise, StarPop, type MotionDials} from '../src';
import {DialPanel} from './DialPanel';
import catalog from '../catalog.json';
import './motion-batch-1.css';

const colors = ['#c5d4bb', '#e4bb9e', '#b9ccd8', '#d8c4d9'];
const pill = (text: string) => <span className="pill" key={text}>{text}</span>;
const image = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="900" height="600" fill="#b9ccd8"/><circle cx="650" cy="180" r="120" fill="#e4bb9e"/><path d="M0 600L300 200L640 600Z" fill="#425e58"/></svg>')}`;
function Sample({id, dials}: {id: string; dials: MotionDials}) {
  switch (id) {
    case 'scroll-focus': return <ScrollFocus as="p" dials={dials} style={{fontSize:'clamp(28px,5vw,60px)',lineHeight:1.2,maxWidth:900}}>A little movement brings a quiet moment into focus. Keep scrolling to watch these words sharpen, settle, and soften again.</ScrollFocus>;
    case 'count-up': return <div className="stats"><CountUp dials={dials}>{['−182', '$49', '100k+', '25+', '1,234.50']}</CountUp></div>;
    case 'star-pop': return <div className="row stars"><StarPop dials={dials}>{Array.from({length:5},(_,i)=><span key={i} role="img" aria-label={`Star ${i+1}`}>★</span>)}</StarPop></div>;
    case 'marquee': return <Marquee dials={dials} label="Creative qualities">{['Made with care','Room to explore','Small details','Fresh perspective','Keep moving'].map(pill)}</Marquee>;
    case 'float': return <div className="row"><Float dials={dials} rotate={.6}>{['Create space','Find a rhythm','Stay curious'].map(pill)}</Float></div>;
    case 'hover-tilt': return <HoverTilt dials={dials}><a className="sample-card" href="#next" style={{background:colors[0]}}><span className="eyebrow">Move your pointer</span><strong>A fresh perspective</strong><span>The card follows a fine pointer.</span></a></HoverTilt>;
    case 'hover-lift': return <HoverLift dials={dials}><button className="action" onClick={event=>{event.currentTarget.textContent='You’re ready'}}>Try this button ↗</button></HoverLift>;
    case 'image-hover-zoom': return <ImageHoverZoom dials={dials} style={{maxWidth:620,borderRadius:18}}><a href="#next"><img src={image} width="900" height="600" alt="Simple green mountain and peach sun on a blue background"/></a></ImageHoverZoom>;
    case 'accordion': return <Accordion dials={dials} items={[
      {id:'one',heading:'How does the motion work?',content:<p>Each piece uses named house tokens. Word dials make small changes easy to explore.</p>},
      {id:'two',heading:'Can I use a keyboard?',content:<p>Yes. Tab to a heading, use the arrow keys to move between headings, then Enter or Space to open it.</p>},
      {id:'three',heading:'What if I prefer less motion?',content:<p>Your device’s reduced-motion setting shows final content and keeps every control working.</p>},
    ]}/>;
    case 'cta-pills': return <div className="row"><CtaPills dials={dials}>{['A clear next step','Made for you','Start something good'].map(pill)}</CtaPills></div>;
    default: return <div className="row"><ScrollRevealRise dials={dials}>{[0,1,2].map(i=><div className="color-block" key={i} style={{background:colors[i]}}>A soft arrival {i+1}</div>)}</ScrollRevealRise></div>;
  }
}
function PieceDemo({id}: {id:string}) {
  const [dials,setDials]=useState<MotionDials>({}); const [replay,setReplay]=useState(0);
  const piece=catalog.pieces.find(piece=>piece.id===id)!;
  return <section id={id} className={`piece piece-${id}`}>
    <div className="piece-heading"><p className="eyebrow">{id}</p><h2>{piece.name}</h2><p>{piece.summary}</p></div>
    <DialPanel pieceId={id} value={dials} onChange={value=>{setDials(value);setReplay(value=>value+1);}} onReplay={()=>setReplay(value=>value+1)}/>
    {id==='scroll-focus' && <p className="hint">Scroll slowly through this section to see both the entrance and exit.</p>}
    <div className="sample" key={replay}><Sample id={id} dials={dials}/></div>
  </section>;
}
const batchIds=['scroll-reveal-rise','scroll-focus','count-up','star-pop','marquee','float','hover-tilt','hover-lift','image-hover-zoom','accordion','cta-pills'];
const root=document.getElementById('root')!;
const selected=root.dataset.piece;
function App(){
 const ids=selected?[selected]:batchIds;
 return <><header><a href="./index.html">← All library demos</a><p className="eyebrow">WCC Motion Library · 0.4.0</p><ScrollRevealRise dials={{blur:'strong',fade:'full',bounce:'none',start:'load'}} distance={batchMotion.blurRise.distance} duration={batchMotion.blurRise.duration} stagger={batchMotion.blurRise.heroStagger*1000} delay={batchMotion.blurRise.heroDelay*1000}><h1>Small details.<br/>A little more life.</h1><p>Explore the motion batch with plain shapes, words, and the same shared dials.</p></ScrollRevealRise><nav>{ids.map(id=><a href={`#${id}`} key={id}>{catalog.pieces.find(p=>p.id===id)?.name}</a>)}</nav></header>
 <main>{ids.map(id=><PieceDemo key={id} id={id}/>)}</main><footer id="next"><h2>Room to keep scrolling.</h2><p>Native scrolling, clear focus, and reduced motion are built in.</p></footer></>;
}
createRoot(root).render(<App/>);
