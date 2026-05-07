export class ParticlePool {
    constructor(poolSize = 1000) {
        this.pool = [];
        for (let i = 0; i < poolSize; i++) {
            this.pool.push({
                active: false,
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                size: 0,
                color: '#ffffff',
                life: 0,
                maxLife: 0,
                decay: 0
            });
        }
    }

    spawn(x, y, vx, vy, size, color, maxLife) {
        // Find first inactive particle
        for (let i = 0; i < this.pool.length; i++) {
            let p = this.pool[i];
            if (!p.active) {
                p.active = true;
                p.x = x;
                p.y = y;
                p.vx = vx;
                p.vy = vy;
                p.size = size;
                p.color = color;
                p.life = maxLife;
                p.maxLife = maxLife;
                return p;
            }
        }
        return null; // Pool exhausted
    }

    update(dt) {
        for (let i = 0; i < this.pool.length; i++) {
            let p = this.pool[i];
            if (p.active) {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                // Friction
                p.vx *= 0.9;
                p.vy *= 0.9;

                p.life -= dt;
                if (p.life <= 0) {
                    p.active = false;
                }
            }
        }
    }

    draw(ctx, offsetX, offsetY) {
        ctx.save();
        for (let i = 0; i < this.pool.length; i++) {
            let p = this.pool[i];
            if (p.active) {
                ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
                ctx.fillStyle = p.color;

                const px = offsetX + p.x;
                const py = offsetY + p.y;

                ctx.beginPath();
                ctx.arc(px, py, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }
}
