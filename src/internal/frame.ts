import {batchMotion} from '../tokens';
type Callback = (time: number, deltaMs: number) => boolean;
const callbacks = new Set<Callback>();
let pending: number | undefined;
let previous: number | undefined;
function tick(time: number) {
  pending = undefined;
  const delta = previous === undefined ? batchMotion.frameMs : Math.max(0, time - previous);
  previous = time;
  for (const callback of [...callbacks]) if (callbacks.has(callback) && !callback(time, delta)) callbacks.delete(callback);
  if (callbacks.size) {
    if (pending === undefined) pending = requestAnimationFrame(tick);
  } else previous = undefined;
}
/** Return true to keep following; false sleeps until the caller subscribes again. */
export function subscribeFrame(callback: Callback) {
  callbacks.add(callback);
  if (pending === undefined) pending = requestAnimationFrame(tick);
  return () => {
    callbacks.delete(callback);
    if (!callbacks.size) {if (pending !== undefined) cancelAnimationFrame(pending); pending = undefined; previous = undefined;}
  };
}
