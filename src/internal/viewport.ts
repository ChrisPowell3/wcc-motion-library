import {subscribeFrame} from './frame';
type Subscription = {element: Element; update: (rect: DOMRectReadOnly, viewportHeight: number, deltaMs: number) => boolean};
const subscribers = new Set<Subscription>();
let stopFrame: (() => void) | undefined;
function wake() {
  if (stopFrame || !subscribers.size) return;
  stopFrame = subscribeFrame((_time, delta) => {
    // Read phase completes before callbacks may write styles or motion values.
    const measurements = [...subscribers].map(subscription => ({subscription, rect: subscription.element.getBoundingClientRect()}));
    const height = window.innerHeight;
    let moving = false;
    for (const {subscription, rect} of measurements) if (subscribers.has(subscription)) moving = subscription.update(rect, height, delta) || moving;
    if (!moving) stopFrame = undefined;
    return moving;
  });
}
/** Shared passive viewport observation; no DOM reads happen in scroll handlers. */
export function observeViewport(element: Element, update: Subscription['update']) {
  const subscription = {element, update};
  if (!subscribers.size) {window.addEventListener('scroll', wake, {passive: true});window.addEventListener('resize', wake, {passive: true});}
  subscribers.add(subscription); wake();
  return () => {
    subscribers.delete(subscription);
    if (!subscribers.size) {
      window.removeEventListener('scroll', wake);window.removeEventListener('resize', wake);
      stopFrame?.();stopFrame = undefined;
    }
  };
}
