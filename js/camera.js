"use strict";
import { lerp } from './mathUtils.js';

export class Camera {
    constructor(maxOffset = 15, maxAngle = 0.05) {
        this.trauma = 0;
        this.maxOffset = maxOffset;
        this.maxAngle = maxAngle;
        this.decayRate = 0.0015; // amount to decay per ms

        this.currentOffsetX = 0;
        this.currentOffsetY = 0;
        this.currentAngle = 0;

        // Viewport
        this.viewportX = 0;
        this.viewportY = 0;
        this.viewportWidth = 800;
        this.viewportHeight = 600;
    }

    resize(width, height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }

    addTrauma(amount) {
        this.trauma = Math.min(this.trauma + amount, 1.0);
    }

    update(dt, targetX, targetY) {
        // Smooth lerp to follow target
        this.viewportX = lerp(this.viewportX, targetX - this.viewportWidth / 2, dt * 0.005);
        this.viewportY = lerp(this.viewportY, targetY - this.viewportHeight / 2, dt * 0.005);

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
        // Apply camera offset (panning)
        ctx.translate(-this.viewportX, -this.viewportY);

        if (this.currentOffsetX !== 0 || this.currentOffsetY !== 0 || this.currentAngle !== 0) {
            // Translate to center to rotate around the center of the screen
            const cx = this.viewportX + canvasWidth / 2;
            const cy = this.viewportY + canvasHeight / 2;

            ctx.translate(cx + this.currentOffsetX, cy + this.currentOffsetY);
            ctx.rotate(this.currentAngle);
            ctx.translate(-cx, -cy);
        }
    }
}
