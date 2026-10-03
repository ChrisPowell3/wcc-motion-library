import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {PinnedScrollStory, type MotionDials} from '../src';
import {DialPanel} from './DialPanel';
import './pinned-scroll-story.css';

// Original inline artwork: no downloaded assets or network requests.
const image = (color: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="700" height="800" viewBox="0 0 700 800"><rect width="700" height="800" fill="${color}"/><circle cx="510" cy="190" r="115" fill="#ffe4bc"/><path d="M0 800V600L220 220L570 800" fill="#264b52"/><path d="M200 800L490 390L700 650V800" fill="#52767a"/></svg>`)}`;
const scenes = [
  ['Your personal plan', 'Build habits that fit your life.', 'A clear nutrition plan, realistic daily goals, and room for the foods you love.', '#d8bb98'],
  ['Coaching every week', 'Keep showing up for yourself.', 'Find encouragement, practical answers, and a next step you can take today.', '#a9c1ca'],
  ['Movement for you', 'Get stronger at your own pace.', 'Choose workouts that meet you where you are and grow with your confidence.', '#b6c1a6'],
  ['A team in your corner', 'Real support from real people.', 'Bring your questions to coaches and providers who listen and help you move forward.', '#d9b4a7'],
  ['A community that cares', 'You belong here.', 'Share the wins, work through the hard days, and celebrate progress together.', '#c5bbd1'],
];
const items = scenes.map(([label, headline, copy, color], index) => ({
  id: `scene-${index}`, label,
  thumbnail: <img className="story-thumbnail" src={image(color)} alt="" />,
  content: <article className="program-panel">
    <img className="program-image" src={image(color)} alt={`Illustrated mountain landscape for ${label.toLowerCase()}`} width={700} height={800}/>
    <div className="program-copy"><p className="eyebrow">What's inside / 0{index + 1}</p><h2>{headline}</h2><p>{copy}</p><a href="#after-story">Explore your membership →</a></div>
  </article>,
}));
function Demo() {
  const [dials, setDials] = useState<MotionDials>({});
  const [key, replay] = useState(0);
  return <main><header><a href="./index.html">← All library demos</a><p className="eyebrow">WCC Motion Library</p><h1>Everything you need.<br/>One step at a time.</h1><p>Five program scenes and a final overview. Scroll down, up, and down again. Smaller screens use the same readable flow when the content cannot fit.</p></header>
    <DialPanel pieceId="pinned-scroll-story" value={dials} onChange={setDials} onReplay={() => replay(value => value + 1)}/>
    <div className="story-boundary" id="before-story">Your next chapter starts here.</div>
    <PinnedScrollStory key={key} items={items} dials={dials} overviewLabel="Your membership at a glance" ariaLabel="What's inside"/>
    <footer className="story-boundary" id="after-story"><h2>Make room for your next chapter.</h2><p>The story is complete. Keep scrolling naturally.</p><a href="#before-story">Read the story again ↑</a></footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Demo/>);
