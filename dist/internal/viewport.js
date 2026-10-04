import { subscribeFrame } from './frame';
const subscribers = new Set();
let stopFrame;
function wake() {
    if (stopFrame || !subscribers.size)
        return;
    stopFrame = subscribeFrame((_time, delta) => {
        // Read phase completes before callbacks may write styles or motion values.
        const measurements = [...subscribers].map(subscription => ({ subscription, rect: subscription.element.getBoundingClientRect() }));
        const height = window.innerHeight;
        const metrics = { scrollY: window.scrollY, scrollHeight: document.documentElement.scrollHeight, width: window.innerWidth };
        let moving = false;
        for (const { subscription, rect } of measurements)
            if (subscribers.has(subscription))
                moving = subscription.update(rect, height, delta, metrics) || moving;
        if (!moving)
            stopFrame = undefined;
        return moving;
    });
}
/** Shared passive viewport observation; no DOM reads happen in scroll handlers. */
export function observeViewport(element, update) {
    const subscription = { element, update };
    if (!subscribers.size) {
        window.addEventListener('scroll', wake, { passive: true });
        window.addEventListener('resize', wake, { passive: true });
    }
    subscribers.add(subscription);
    wake();
    return () => {
        subscribers.delete(subscription);
        if (!subscribers.size) {
            window.removeEventListener('scroll', wake);
            window.removeEventListener('resize', wake);
            stopFrame?.();
            stopFrame = undefined;
        }
    };
}
