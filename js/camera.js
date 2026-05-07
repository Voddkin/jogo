export class Camera {
    constructor(maxOffset = 15, maxAngle = 0.05) {
        this.x = 0;
        this.y = 0;
        this.trauma = 0;
        this.maxOffset = maxOffset;
        this.maxAngle = maxAngle;
        this.decayRate = 0.0015; // amount to decay per ms

        this.currentOffsetX = 0;
        this.currentOffsetY = 0;
        this.currentAngle = 0;
    }

    addTrauma(amount) {
        this.trauma = Math.min(this.trauma + amount, 1.0);
    }

    update(dt) {
        if (this.trauma > 0) {
            this.trauma = Math.max(this.trauma - dt * this.decayRate, 0);

            const shakeMagnitude = this.trauma * this.trauma;
            this.currentOffsetX = this.maxOffset * shakeMagnitude * (Math.random() * 2 - 1);
            this.currentOffsetY = this.maxOffset * shakeMagnitude * (Math.random() * 2 - 1);
            this.currentAngle = this.maxAngle * shakeMagnitude * (Math.random() * 2 - 1);
        } else {
            this.currentOffsetX = 0;
            this.currentOffsetY = 0;
            this.currentAngle = 0;
        }
    }

    applyTransform(ctx, canvasWidth, canvasHeight) {
        if (this.currentOffsetX !== 0 || this.currentOffsetY !== 0 || this.currentAngle !== 0) {
            // Translate to center to rotate around the center of the screen
            const cx = canvasWidth / 2;
            const cy = canvasHeight / 2;

            ctx.translate(cx + this.currentOffsetX, cy + this.currentOffsetY);
            ctx.rotate(this.currentAngle);
            ctx.translate(-cx, -cy);
        }
    }
}
