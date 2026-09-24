import {StrictMode, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {SwipeCarousel, type SwipeCarouselItem} from '../src';

const colors = ['#465e72', '#927061', '#6a7158', '#287367', '#75648c', '#a7783e'];
const titles = ['Find your rhythm.', 'Start with one step.', 'Make room to grow.', 'Move with purpose.', 'Build your strength.', 'Keep showing up.'];
const items: SwipeCarouselItem[] = colors.map((color, i) => ({
  id: `chapter-${i + 1}`,
  image: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="960"><rect width="720" height="960" fill="${color}"/></svg>`)}`,
  alt: `Solid ${['slate blue', 'clay', 'olive', 'teal', 'violet', 'ochre'][i]} placeholder`,
  title: titles[i],
  text: ['Small, steady moves. A little more confidence every day.', 'Progress begins exactly where you are.', 'Create space for the things that move you forward.', 'A fresh perspective is always within reach.', 'The work you do today becomes tomorrow’s foundation.', 'Stay curious. Stay consistent. Enjoy the journey.'][i],
  cta: {label: 'Explore chapter', href: `#chapter-${i + 1}`},
}));

const customItems = items.map((item, index) => ({
  id: `custom-${item.id}`, artwork: item.image, alt: item.alt,
  heading: item.title, description: item.text, number: index + 1, href: `#${item.id}`,
}));

function Demo() {
  const [index, setIndex] = useState(3);
  return <>
    <header style={{maxWidth: 1280, margin: '0 auto', padding: '28px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16}}>
      <a href="./index.html" style={{color: 'inherit', textDecoration: 'none', fontWeight: 800, fontSize: 15, letterSpacing: '-.02em'}}>WCC / MOTION LIBRARY</a>
      <span style={{fontSize: 11, letterSpacing: '.12em'}}>PIECE 001 · V0.2 · BETA</span>
    </header>
    <main>
      <section style={{textAlign: 'center', maxWidth: 680, padding: '64px 24px 24px', margin: 'auto'}}>
        <p style={{fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase'}}>A little momentum goes a long way</p>
        <h1 style={{fontSize: 'clamp(46px, 8vw, 88px)', lineHeight: .98, letterSpacing: '-.065em', fontWeight: 500, margin: '22px 0'}}>One move.<br/>A new perspective.</h1>
        <p style={{fontSize: 16, lineHeight: 1.6, color: '#586a63', maxWidth: 400, margin: '24px auto 8px'}}>Drag, swipe, or use the arrow keys.<br/>Find the card that speaks to you.</p>
      </section>
      <SwipeCarousel items={items} onChange={setIndex}/>
      <p style={{textAlign: 'center', fontSize: 11, letterSpacing: '.15em', margin: '16px 0 72px'}}>CHAPTER {String(index + 1).padStart(2, '0')} / 06</p>
      <section style={{maxWidth: 1100, margin: '0 auto', borderTop: '1px solid #c8cfc4', padding: '36px 24px 80px', display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between'}}>
        <div><h2 style={{fontSize: 24, fontWeight: 500, letterSpacing: '-.04em', margin: '0 0 12px'}}>Built to feel natural.</h2><p style={{fontSize: 14, lineHeight: 1.7, maxWidth: 360, color: '#586a63'}}>Direct touch. A soft landing. Just enough motion to keep your place.</p></div>
        <p style={{fontSize: 13, lineHeight: 1.9, color: '#586a63'}}>Sideways trackpad gestures move the cards.<br/>Scroll down as usual to keep exploring.<br/>Your device’s reduced-motion preference is respected.</p>
      </section>
      <section aria-labelledby="custom-cards-heading" style={{padding: '24px 0 72px', borderTop: '1px solid #c8cfc4'}}>
        <div style={{textAlign: 'center', maxWidth: 600, padding: '40px 24px 16px', margin: 'auto'}}>
          <p style={{fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase'}}>A different look. The same feel.</p>
          <h2 id="custom-cards-heading" style={{fontSize: 'clamp(34px, 5vw, 56px)', fontWeight: 500, letterSpacing: '-.05em', margin: '16px 0'}}>Your story. Your style.</h2>
          <p style={{fontSize: 15, color: '#586a63', lineHeight: 1.6}}>Six chapters, a fresh card design, and the same effortless movement.</p>
        </div>
        <SwipeCarousel items={customItems} label="Explore the chapters" cardAspect="auto"
          cardStyle={{borderRadius: 18, background: '#fff', boxShadow: '0 10px 26px -18px rgba(0,0,0,.4)'}}
          renderCard={(item, {loadImage}) => <>
            <div style={{aspectRatio: '4 / 3', background: colors[item.number - 1]}}>
              <img src={loadImage ? item.artwork : undefined} alt={item.alt} loading="lazy"
                style={{display: 'block', width: '100%', height: '100%', objectFit: 'cover'}}/>
            </div>
            <div style={{background: '#fff', color: '#203c3b', padding: '24px 22px 28px'}}>
              <span style={{display: 'inline-grid', placeItems: 'center', width: 32, height: 32, borderRadius: '50%', background: '#edf0e8', fontSize: 11, fontWeight: 700}}>{String(item.number).padStart(2, '0')}</span>
              <h3 style={{fontSize: 25, letterSpacing: '-.04em', lineHeight: 1.1, margin: '16px 0 12px'}}>{item.heading}</h3>
              <p style={{fontSize: 14, lineHeight: 1.6, color: '#586a63', margin: '0 0 20px'}}>{item.description}</p>
              <a href={item.href} style={{display: 'inline-block', color: '#203c3b', fontWeight: 700, fontSize: 13, padding: '8px 0', textUnderlineOffset: 4}}>Read this chapter →</a>
            </div>
          </>}/>
      </section>
      {items.map((item, i) => <section id={item.id} key={item.id} style={{maxWidth: 1052, margin: '0 auto', padding: '32px 24px', borderTop: '1px solid #c8cfc4', scrollMarginTop: 24}}>
        <p style={{fontSize: 11, letterSpacing: '.15em'}}>CHAPTER {String(i + 1).padStart(2, '0')}</p><h2 style={{fontWeight: 500}}>{item.title}</h2><p style={{color: '#586a63', lineHeight: 1.6}}>{item.text}</p>
      </section>)}
    </main>
    <footer style={{padding: '48px 24px', textAlign: 'center', fontSize: 11, letterSpacing: '.12em'}}>WCC MOTION LIBRARY · BUILT FROM SCRATCH</footer>
  </>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><Demo/></StrictMode>);
