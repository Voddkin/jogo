export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

export const Easing = {
    easeInQuad: function(t) {
        return t * t;
    },
    easeOutQuad: function(t) {
        return t * (2 - t);
    },
    easeInOutQuad: function(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    easeOutElastic: function(t) {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    easeOutBack: function(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
};
