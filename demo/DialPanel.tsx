import {useId} from 'react';
import {SHARED_DIALS, PIECE_DIALS, type DialId, type MotionDials} from '../src';
import catalog from '../catalog.json';

const vocabulary = {...SHARED_DIALS, ...PIECE_DIALS};
const labels: Record<DialId, string> = {speed: 'Speed', size: 'Size', bounce: 'Bounce', plays: 'Plays', delay: 'Delay', cascade: 'Cascade', direction: 'Direction', fade: 'Fade', start: 'Start', autoplay: 'Autoplay', loop: 'Loop', sideCards: 'Side cards', flick: 'Flick', blur: 'Blur'};

export function DialPanel({pieceId, value, onChange, onReplay}: {
  pieceId: string;
  value: MotionDials;
  onChange: (value: MotionDials) => void;
  onReplay: () => void;
}) {
  const id = useId();
  const piece = catalog.pieces.find(piece => piece.id === pieceId)!;
  return <fieldset style={{maxWidth: 1100, margin: '24px auto', padding: 20, border: '1px solid #bcc7bf', borderRadius: 12, color: '#203c3b', background: '#f8f6f0'}}>
    <legend style={{padding: '0 8px', fontSize: 15, fontWeight: 600}}>Try the motion dials</legend>
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 14}}>
      {piece.dials.map(raw => {
        const dial = raw as DialId;
        const defaults = piece.dialDefaults as MotionDials;
        return <div key={dial} style={{display: 'grid', gap: 6, fontSize: 13}}>
          <label htmlFor={`${id}-${dial}`}>{labels[dial]}</label>
          <select id={`${id}-${dial}`} value={value[dial] ?? ''} onChange={event => {
            const next = {...value};
            if (event.target.value) next[dial] = event.target.value;
            else delete next[dial];
            onChange(next);
          }} style={{minWidth: 0, width: '100%', minHeight: 44, padding: '8px 6px', border: '1px solid #879c91', borderRadius: 6, color: 'inherit', background: '#fff', font: 'inherit'}}>
            <option value="">Default ({'dialDefaultNotes' in piece && (piece.dialDefaultNotes as Record<string,string> | undefined)?.[dial] ? 'reference preset' : defaults[dial]})</option>
            {(('dialValues' in piece ? (piece.dialValues as Partial<Record<DialId, readonly string[]>>)?.[dial] : undefined) ?? vocabulary[dial]).map(word => <option value={word} key={word}>{word}</option>)}
          </select>
        </div>;
      })}
    </div>
    <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 18}}>
      <button type="button" onClick={onReplay} style={{minHeight: 44, padding: '10px 16px', borderRadius: 24, background: '#203c3b', color: '#fff', border: 0, font: 'inherit', fontSize: 13, cursor: 'pointer'}}>Replay samples</button>
      <button type="button" onClick={() => onChange({})} style={{minHeight: 44, padding: '10px 16px', borderRadius: 24, background: 'transparent', color: '#203c3b', border: '1px solid #879c91', font: 'inherit', fontSize: 13, cursor: 'pointer'}}>Reset dials</button>
      <p style={{flex: '1 1 250px', margin: 0, fontSize: 13, lineHeight: 1.5}}>Changes apply to the samples below. Scroll to see full entrances. Your device’s reduced-motion preference always wins.</p>
    </div>
  </fieldset>;
}
