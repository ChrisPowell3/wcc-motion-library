import type {CSSProperties} from 'react';

export const styles = {
  region: {position: 'relative', width: '100%', minWidth: 0, color: 'inherit', fontFamily: 'inherit'},
  viewport: {display: 'grid', placeItems: 'center', overflow: 'hidden', padding: '28px 0 36px', touchAction: 'pan-y pinch-zoom', userSelect: 'none', isolation: 'isolate'},
  card: {gridArea: '1 / 1', position: 'relative', aspectRatio: '3 / 4', borderRadius: 24, overflow: 'hidden', background: '#23373d', color: '#fff', boxShadow: '0 12px 24px -16px rgba(0,0,0,.55)', transformOrigin: 'center', minWidth: 0},
  image: {position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none'},
  content: {position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 'clamp(20px, 5vw, 32px)', background: 'linear-gradient(transparent 20%, rgba(0,0,0,.85))'},
  title: {fontSize: 'clamp(24px, 5vw, 34px)', lineHeight: 1.1, letterSpacing: '-.035em', margin: '0 0 10px', overflowWrap: 'anywhere'},
  text: {fontSize: 15, lineHeight: 1.5, margin: '0 0 20px', overflowWrap: 'anywhere'},
  cta: {alignSelf: 'flex-start', display: 'inline-flex', padding: '11px 17px', borderRadius: 999, color: '#14262a', background: '#fff', fontSize: 14, fontWeight: 650, textDecoration: 'none'},
  dots: {display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0, padding: '0 16px'},
  dot: {display: 'grid', placeItems: 'center', width: 44, height: 44, padding: 0, border: 0, borderRadius: 12, background: 'transparent', color: 'inherit', cursor: 'pointer'},
  dotMark: {display: 'block', width: 8, height: 8, borderRadius: 999, background: 'currentColor'},
  srOnly: {position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap', border: 0},
} satisfies Record<string, CSSProperties>;

export const focusRing: CSSProperties = {outline: '3px solid currentColor', outlineOffset: 4};
