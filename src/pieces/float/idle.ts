import {cubicBezier} from 'motion';
import {subscribeFrame} from '../../internal/frame';
import {batchMotion} from '../../tokens';

const curve = cubicBezier(...batchMotion.idleEase);

/** A reversible idle clock whose pause actually unsubscribes from frame work. */
export function createIdleTrack(duration: number, delay: number, update: (progress: number) => void) {
  let elapsed = -delay;
  let release: (() => void) | undefined;
  const pause = () => {release?.(); release = undefined;};
  return {
    play() {
      if (release) return;
      release = subscribeFrame((_time, delta) => {
        elapsed += delta / 1000;
        if (elapsed >= 0) {
          const phase = (elapsed / duration) % 2;
          update(curve(phase <= 1 ? phase : 2 - phase));
        }
        return true;
      });
    },
    pause,
    stop: pause,
  };
}
