type Options = {threshold?: number; rootMargin?: string};
type Pool = {observer: IntersectionObserver; targets: Map<Element, Set<(visible: boolean) => void>>; latest: Map<Element, boolean>};
const pools = new Map<string, Pool>();

/** One native observer per viewport configuration, shared by all pieces. */
export function observeVisibility(element: Element, callback: (visible: boolean) => void, options: Options = {}) {
  if (typeof IntersectionObserver === 'undefined') { callback(true); return () => {}; }
  const threshold = options.threshold ?? .12, rootMargin = options.rootMargin ?? '0px 0px -6% 0px';
  const key = `${threshold}|${rootMargin}`;
  let pool = pools.get(key);
  if (!pool) {
    try {
      const targets: Pool['targets'] = new Map(), latest: Pool['latest'] = new Map();
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          latest.set(entry.target, entry.isIntersecting);
          for (const listener of [...(targets.get(entry.target) ?? [])]) listener(entry.isIntersecting);
        }
      }, {threshold, rootMargin});
      pool = {observer, targets, latest}; pools.set(key, pool);
    } catch { callback(true); return () => {}; }
  }
  const listeners = pool.targets.get(element) ?? new Set();
  const first = listeners.size === 0;
  listeners.add(callback); pool.targets.set(element, listeners);
  if (first) pool.observer.observe(element);
  else if (pool.latest.has(element)) callback(pool.latest.get(element)!);
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true; listeners.delete(callback);
    if (!listeners.size) {pool!.observer.unobserve(element); pool!.targets.delete(element); pool!.latest.delete(element);}
    if (!pool!.targets.size) {pool!.observer.disconnect(); pools.delete(key);}
  };
}
