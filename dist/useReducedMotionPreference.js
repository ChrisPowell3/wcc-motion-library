'use client';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
/** Motion's initial preference plus live OS updates, without import-time DOM access. */
export function useReducedMotionPreference() {
    const initial = useReducedMotion();
    const [live, setLive] = useState(null);
    useEffect(() => {
        if (typeof window.matchMedia !== 'function')
            return;
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setLive(query.matches);
        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);
    return live ?? initial ?? false;
}
