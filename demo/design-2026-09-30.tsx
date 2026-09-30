import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {CursorFollowImage,CursorProximityFade,FullscreenViewer,ImageLoadBlurIn,ParallaxDrift,PinnedScrollStory,ScrollStackCards,type MotionDials} from '../src';
import {DialPanel} from './DialPanel';
import catalog from '../catalog.json';
import './motion-batch-1.css';
import './design-2026-09-30.css';
const colors=['#cad8ba','#e4bb9e','#b9ccd8'];
const landscape=(index:number)=>`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500"><rect width="900" height="500" fill="${colors[index%3]}"/><circle cx="660" cy="140" r="90" fill="#faf4d9"/><path d="M0 500L310 110L650 500Z" fill="#45635c"/><path d="M420 500L680 240L900 500Z" fill="#8da48e"/></svg>`)}`;
const titles=['A fresh perspective','Room to explore','A quiet moment'];
const images=titles.map((title,index)=><img key={title} src={landscape(index)} alt={`${title}: geometric mountain landscape`} width="900" height="500"/>);
const storyItems=titles.map((label,index)=>({id:`scene-${index}`,label,thumbnail:<span className="tile-swatch" style={{background:colors[index]}}/>,content:<div className="story-card" style={{background:colors[index]}}><p className="eyebrow">Chapter {index+1}</p><h3>{label}</h3><p>A simple scene with a little space to breathe. Scroll to continue the story.</p><a href="#after-story">Continue reading</a></div>}));
function Sample({id,dials}:{id:string;dials:MotionDials}){
 switch(id){
  case 'image-load-blur-in':return <ImageLoadBlurIn src={landscape(1)} alt="Green mountain and pale sun against a peach sky" dials={dials} aspectRatio="9 / 5" style={{borderRadius:20}}/>;
  case 'parallax-drift':return <div className="drift-window"><ParallaxDrift dials={dials}>{images[0]}</ParallaxDrift></div>;
  case 'cursor-proximity-fade':return <><p>The cue sits in the lower corner near the top of the page. Move nearby or rest the pointer, then scroll to hide it. Keyboard focus always reveals it.</p><button className="action" onClick={()=>window.scrollTo({top:0,behavior:'instant'})}>Back to the page top</button><CursorProximityFade dials={dials} style={{position:'fixed',bottom:24,right:24,zIndex:5}}><a className="proximity-cue" href="#after-story">Keep reading ↓</a></CursorProximityFade></>;
  case 'fullscreen-viewer':return <FullscreenViewer dials={dials} items={titles.map((label,index)=>({id:`photo-${index}`,label,thumbnail:<>{images[index]}<span className="thumb-label">Open {label.toLowerCase()} ↗</span></>,content:<figure style={{margin:0}}>{images[index]}<figcaption style={{padding:'16px 0',fontSize:20}}>{label}</figcaption></figure>}))}/>;
  case 'pinned-scroll-story':return <><PinnedScrollStory items={storyItems} dials={dials}/><div id="after-story" className="story-end">The story ends here. Keep scrolling naturally.</div></>;
  case 'scroll-stack-cards':return <ScrollStackCards dials={dials} top={24}>{titles.map((title,index)=><article key={title} className="stack-card" style={{background:colors[index]}}><div><p className="eyebrow">Card {index+1}</p><h3>{title}</h3><p>Each scene makes room for the next.</p><a href="#page-end">Explore the details ↗</a></div>{images[index]}</article>)}</ScrollStackCards>;
  default:return <CursorFollowImage dials={dials} style={{borderRadius:20,overflow:'hidden',background:colors[2]}}>{images[2]}</CursorFollowImage>;
 }
}
function Piece({id}:{id:string}){
 const [dials,setDials]=useState<MotionDials>({});const [key,replay]=useState(0);const piece=catalog.pieces.find(piece=>piece.id===id)!;
 return <section id={id} className="piece"><p className="eyebrow">{id}</p><h2>{piece.name}</h2><p>{piece.summary}</p><DialPanel pieceId={id} value={dials} onChange={value=>{setDials(value);replay(k=>k+1);}} onReplay={()=>replay(k=>k+1)}/><div className="sample" key={key}><Sample id={id} dials={dials}/></div></section>;
}
const ids=['parallax-drift','image-load-blur-in','cursor-proximity-fade','fullscreen-viewer','pinned-scroll-story','scroll-stack-cards','cursor-follow-image'];
const element=document.getElementById('root')!,selected=element.dataset.piece;
const shown=selected?[selected]:ids;
createRoot(element).render(<div className="design-demo"><header><a href="./index.html">← All library demos</a><p className="eyebrow">WCC Motion Library · Design study</p><h1>A change in perspective.</h1><p>Seven motion pieces, built for any site. Explore each sample with the shared word dials.</p><nav>{shown.map(id=><a key={id} href={`#${id}`}>{catalog.pieces.find(piece=>piece.id===id)?.name}</a>)}</nav></header><main>{shown.map(id=><Piece id={id} key={id}/>)}</main><footer id="page-end"><h2>Keep the page moving.</h2><p>Native scrolling, accessible controls, and room for your own content.</p></footer></div>);
