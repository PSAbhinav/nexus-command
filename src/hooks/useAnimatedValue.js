import { useState, useEffect, useRef } from 'react';

/**
 * Animates a numeric value from 0 to target using easeOutExpo.
 * @param {number} target - The target number
 * @param {number} duration - Animation duration in ms (default 900)
 * @param {number} decimals - Decimal places to show (default 0)
 * @returns {string} The animated value as a formatted string
 */
export default function useAnimatedValue(target, duration = 900, decimals = 0) {
    const [value, setValue] = useState(0);
    const prevTarget = useRef(0);
    const frameRef = useRef(null);

    useEffect(() => {
        const start = prevTarget.current;
        const diff = target - start;
        if (diff === 0) return;

        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutExpo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = start + diff * eased;
            setValue(current);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            } else {
                prevTarget.current = target;
            }
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameRef.current);
    }, [target, duration]);

    if (decimals === 0) return Math.round(value).toLocaleString();
    return value.toFixed(decimals);
}
