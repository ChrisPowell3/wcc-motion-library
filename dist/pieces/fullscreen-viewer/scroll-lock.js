// Shared by viewer instances, with no browser access during module evaluation.
const locks = new WeakMap();
const properties = ['overflow', 'overflow-x', 'overflow-y'];
export function lockPageScroll(doc) {
    let lock = locks.get(doc);
    if (!lock) {
        const snapshots = [doc.documentElement, doc.body].map(node => ({ node, values: properties.map(property => ({ property, value: node.style.getPropertyValue(property), priority: node.style.getPropertyPriority(property) })) }));
        for (const { node } of snapshots)
            node.style.setProperty('overflow', 'hidden', 'important');
        lock = { count: 0, restore: () => {
                for (const { node, values } of snapshots) {
                    for (const property of properties)
                        node.style.removeProperty(property);
                    for (const { property, value, priority } of values)
                        if (value)
                            node.style.setProperty(property, value, priority);
                }
            } };
        locks.set(doc, lock);
    }
    lock.count++;
    let released = false;
    return () => {
        if (released)
            return;
        released = true;
        if (--lock.count === 0) {
            lock.restore();
            locks.delete(doc);
        }
    };
}
