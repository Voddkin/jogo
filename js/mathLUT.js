const LUT_SIZE = 3600;
const RAD_TO_INDEX = LUT_SIZE / (2 * Math.PI);

const sinLUT = new Float32Array(LUT_SIZE);
const cosLUT = new Float32Array(LUT_SIZE);

// Precompute values
for (let i = 0; i < LUT_SIZE; i++) {
    const angleRads = (i / LUT_SIZE) * (2 * Math.PI);
    sinLUT[i] = Math.sin(angleRads);
    cosLUT[i] = Math.cos(angleRads);
}

export const MathLUT = {
    sin: function(angleRads) {
        // Normalize angle to positive
        let rads = angleRads % (2 * Math.PI);
        if (rads < 0) rads += 2 * Math.PI;
        // Fast truncation using bitwise OR
        const index = (rads * RAD_TO_INDEX) | 0;
        return sinLUT[index % LUT_SIZE];
    },

    cos: function(angleRads) {
        let rads = angleRads % (2 * Math.PI);
        if (rads < 0) rads += 2 * Math.PI;
        const index = (rads * RAD_TO_INDEX) | 0;
        return cosLUT[index % LUT_SIZE];
    }
};
