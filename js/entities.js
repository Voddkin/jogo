// Tile types
export const TILE_EMPTY = 0;
export const TILE_WALL = 1;
export const TILE_ROLLER_RIGHT = 2;
export const TILE_KEY_RED = 3;
export const TILE_GATE_RED = 4;
export const TILE_LASER = 5;
export const TILE_BUTTON = 6;
export const TILE_EXIT = 7;
export const TILE_ROLLER_LEFT = 8;
export const TILE_ROLLER_UP = 9;
export const TILE_ROLLER_DOWN = 10;
export const TILE_ICE = 11;
export const TILE_WARP_A = 12;
export const TILE_WARP_B = 13;
export const TILE_FRAGILE = 14;
export const TILE_HOLE = 15;

export class GridMap {
    /**
     * @param {Object} parsedData { gridMatrix, initialBoxes }
     */
    constructor(cols, rows, parsedData) {
        this.cols = cols;
        this.rows = rows;
        this.initialBoxes = parsedData.initialBoxes;
        this.initialGridData = parsedData.gridMatrix;
        this.grid = JSON.parse(JSON.stringify(this.initialGridData));
        this.redGatesOpen = false;
        this.buttonPressed = false;
    }

    findTile(type) {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x] === type) {
                    return {x, y};
                }
            }
        }
        return null;
    }

    reset() {
        this.grid = JSON.parse(JSON.stringify(this.initialGridData));
        this.redGatesOpen = false;
        this.buttonPressed = false;
    }

    getTile(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
            return TILE_WALL; // Out of bounds acts as a wall
        }
        return this.grid[y][x];
    }

    setTile(x, y, type) {
        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
            this.grid[y][x] = type;
        }
    }

    isWalkable(x, y) {
        const tile = this.getTile(x, y);
        if (tile === TILE_WALL || tile === TILE_HOLE) return false;
        if (tile === TILE_GATE_RED && !this.redGatesOpen) return false;
        if (tile === TILE_LASER && !this.buttonPressed) return false;
        return true;
    }

    interact(x, y) {
        const tile = this.getTile(x, y);
        if (tile === TILE_KEY_RED) {
            this.redGatesOpen = true;
            this.setTile(x, y, TILE_EMPTY); // consume key
            console.log("Red Key collected. Red Gates opened!");
        }
        // Button is handled by checking if robot is on it or EMP covers it
    }

    draw(ctx, tileSize, offsetX, offsetY) {
        ctx.save();
        ctx.translate(offsetX, offsetY);

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const tile = this.getTile(x, y);
                const px = x * tileSize;
                const py = y * tileSize;

                // --- Draw base floor (Cyber-Minimalist) ---
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // Transparent dark base
                ctx.fillRect(px, py, tileSize, tileSize);

                // Subtle technological grid strokes
                ctx.strokeStyle = '#2d2d3d';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, py, tileSize, tileSize);

                // Reset shadow defaults
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetY = 0;

                if (tile === TILE_WALL) {
                    // Drop shadow for depth
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                    ctx.shadowBlur = 8;
                    ctx.shadowOffsetY = 4;

                    // Gradient block
                    const gradient = ctx.createLinearGradient(px, py, px, py + tileSize);
                    gradient.addColorStop(0, '#5a5a6a');
                    gradient.addColorStop(1, '#2a2a35');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(px, py, tileSize, tileSize);

                    // Highlight edge (beveling)
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                    ctx.fillRect(px, py, tileSize, 2);
                } else if (tile === TILE_ROLLER_RIGHT || tile === TILE_ROLLER_LEFT || tile === TILE_ROLLER_UP || tile === TILE_ROLLER_DOWN) {
                    ctx.fillStyle = '#222233';
                    ctx.fillRect(px, py, tileSize, tileSize);
                    ctx.fillStyle = '#4444aa';
                    const s = tileSize / 50; // scaling factor relative to 50
                    ctx.beginPath();
                    if (tile === TILE_ROLLER_RIGHT) {
                        ctx.moveTo(px + 10*s, py + 15*s); ctx.lineTo(px + 35*s, py + 25*s); ctx.lineTo(px + 10*s, py + 35*s);
                    } else if (tile === TILE_ROLLER_LEFT) {
                        ctx.moveTo(px + 40*s, py + 15*s); ctx.lineTo(px + 15*s, py + 25*s); ctx.lineTo(px + 40*s, py + 35*s);
                    } else if (tile === TILE_ROLLER_UP) {
                        ctx.moveTo(px + 15*s, py + 40*s); ctx.lineTo(px + 25*s, py + 15*s); ctx.lineTo(px + 35*s, py + 40*s);
                    } else if (tile === TILE_ROLLER_DOWN) {
                        ctx.moveTo(px + 15*s, py + 10*s); ctx.lineTo(px + 25*s, py + 35*s); ctx.lineTo(px + 35*s, py + 10*s);
                    }
                    ctx.fill();
                } else if (tile === TILE_KEY_RED) {
                    ctx.shadowColor = '#ff2222';
                    ctx.shadowBlur = 10;
                    ctx.fillStyle = '#ff4444';
                    ctx.beginPath();
                    ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.16, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(px + tileSize / 2 - 2, py + tileSize / 2 - 2, tileSize * 0.04, 0, Math.PI * 2);
                    ctx.fill();
                } else if (tile === TILE_GATE_RED) {
                    ctx.fillStyle = this.redGatesOpen ? '#2a1111' : '#ff2222';
                    ctx.fillRect(px, py, tileSize, tileSize);
                    if (!this.redGatesOpen) {
                        ctx.strokeStyle = '#550000';
                        ctx.lineWidth = 4;
                        ctx.strokeRect(px + 4, py + 4, tileSize - 8, tileSize - 8);
                        ctx.lineWidth = 1;
                    }
                } else if (tile === TILE_LASER) {
                    if (!this.buttonPressed) {
                        ctx.shadowColor = '#ff0055';
                        ctx.shadowBlur = 15;
                        ctx.fillStyle = '#ff0055';
                        ctx.fillRect(px + tileSize / 2 - 3, py, 6, tileSize);

                        ctx.shadowBlur = 0;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(px + tileSize / 2 - 1, py, 2, tileSize);
                    }
                } else if (tile === TILE_BUTTON) {
                    const btnColor = this.buttonPressed ? '#00ffaa' : '#225544';
                    ctx.shadowColor = this.buttonPressed ? '#00ffaa' : 'transparent';
                    ctx.shadowBlur = this.buttonPressed ? 15 : 0;
                    ctx.fillStyle = btnColor;
                    ctx.beginPath();
                    ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.24, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                } else if (tile === TILE_EXIT) {
                    ctx.shadowColor = '#00ffaa';
                    ctx.shadowBlur = 15;
                    ctx.fillStyle = '#00ffaa';
                    ctx.fillRect(px + tileSize*0.2, py + tileSize*0.2, tileSize * 0.6, tileSize * 0.6);
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(px + tileSize*0.2, py + tileSize*0.2, tileSize * 0.6, tileSize * 0.6);
                    ctx.lineWidth = 1;
                } else if (tile === TILE_ICE) {
                    ctx.fillStyle = '#88ccff';
                    ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
                } else if (tile === TILE_WARP_A || tile === TILE_WARP_B) {
                    const color = tile === TILE_WARP_A ? '#aa00ff' : '#ff00aa';
                    const time = Date.now() / 500;
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 15;
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;

                    const step = tileSize / 8;
                    for(let r = step; r <= tileSize/2 - 5; r += step) {
                        ctx.beginPath();
                        ctx.arc(px + tileSize / 2, py + tileSize / 2, r + Math.sin(time + r)*2, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.lineWidth = 1;
                } else if (tile === TILE_FRAGILE) {
                    ctx.fillStyle = '#3a3a2a';
                    ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
                } else if (tile === TILE_HOLE) {
                    ctx.fillStyle = '#050505';
                    ctx.fillRect(px, py, tileSize, tileSize);
                    ctx.shadowColor = '#000000';
                    ctx.shadowBlur = 10;
                    ctx.shadowOffsetY = 0;
                    ctx.strokeStyle = '#111';
                    ctx.strokeRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
                }

                // Clear shadows before next tile
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetY = 0;
            }
        }

        ctx.restore();
    }
}

export class Robot {
    constructor(startX, startY, startDir) {
        this.startX = startX;
        this.startY = startY;
        this.startDir = startDir;

        this.x = startX;
        this.y = startY;
        // Direction: 0 = East, 1 = South, 2 = West, 3 = North
        this.dir = startDir;
        this.empActive = false;

        // Visual properties for smooth animation
        this.visualX = startX;
        this.visualY = startY;
        this.visualDir = startDir;

        // Animation state
        this.isAnimating = false;
        this.animProgress = 0;
        this.animSpeed = 0.003; // ~333ms per tile based on dt in ms

        this.targetX = startX;
        this.targetY = startY;
        this.targetDir = startDir;
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.dir = this.startDir;
        this.empActive = false;

        this.visualX = this.startX;
        this.visualY = this.startY;
        this.visualDir = this.startDir;
        this.isAnimating = false;
        this.animProgress = 0;
    }

    updateAnimation(dt) {
        if (!this.isAnimating) return;

        this.animProgress += this.animSpeed * dt;
        if (this.animProgress >= 1) {
            this.animProgress = 1;
            this.isAnimating = false;
        }

        // Interpolate position
        this.visualX = this.x + (this.targetX - this.x) * this.animProgress;
        this.visualY = this.y + (this.targetY - this.y) * this.animProgress;

        // Interpolate rotation (handling wrap-around nicely)
        let diff = this.targetDir - this.dir;
        if (diff > 2) diff -= 4;
        if (diff < -2) diff += 4;
        this.visualDir = this.dir + diff * this.animProgress;
    }

    finishAnimation() {
        this.x = this.targetX;
        this.y = this.targetY;
        // normalize dir
        this.dir = (this.targetDir % 4 + 4) % 4;
        this.visualX = this.x;
        this.visualY = this.y;
        this.visualDir = this.dir;
        this.isAnimating = false;
    }

    setTarget(tx, ty, tdir) {
        this.x = this.visualX;
        this.y = this.visualY;
        this.dir = this.visualDir;
        this.targetX = tx;
        this.targetY = ty;
        this.targetDir = tdir;
        this.animProgress = 0;
        this.isAnimating = true;
    }

    draw(ctx, tileSize, offsetX, offsetY) {
        const px = offsetX + this.visualX * tileSize + tileSize / 2;
        const py = offsetY + this.visualY * tileSize + tileSize / 2;
        const rotation = this.visualDir * Math.PI / 2;

        if (this.empActive) {
            const pulse = (Math.sin(Date.now() / 150) + 1) / 2; // 0 to 1
            const pulseRadius = tileSize * 1.3 + pulse * (tileSize * 0.2);
            const pulseOpacity = 0.1 + pulse * 0.2;

            ctx.fillStyle = `rgba(0, 255, 170, ${pulseOpacity})`;
            ctx.beginPath();
            ctx.arc(px, py, pulseRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(0, 255, 170, ${pulseOpacity * 2})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(rotation);

        // Shadow
        ctx.shadowColor = 'rgba(255, 107, 0, 0.4)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 5;

        // Elegant Chassis
        ctx.fillStyle = '#FF6B00';
        ctx.beginPath();
        if(ctx.roundRect) {
            ctx.roundRect(-tileSize * 0.35, -tileSize * 0.35, tileSize * 0.7, tileSize * 0.7, tileSize * 0.15);
        } else {
            ctx.rect(-tileSize * 0.35, -tileSize * 0.35, tileSize * 0.7, tileSize * 0.7);
        }
        ctx.fill();

        // Inner Chassis Detail
        ctx.shadowColor = 'transparent'; // reset shadow for inner details
        ctx.fillStyle = '#cc5500';
        ctx.beginPath();
        if(ctx.roundRect) {
            ctx.roundRect(-tileSize * 0.25, -tileSize * 0.25, tileSize * 0.4, tileSize * 0.5, tileSize * 0.08);
        } else {
            ctx.rect(-tileSize * 0.25, -tileSize * 0.25, tileSize * 0.4, tileSize * 0.5);
        }
        ctx.fill();

        // Glowing Visor
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#eeffff';
        ctx.beginPath();
        if(ctx.roundRect) {
            ctx.roundRect(tileSize * 0.15, -tileSize * 0.2, tileSize * 0.15, tileSize * 0.4, tileSize * 0.08);
        } else {
            ctx.rect(tileSize * 0.15, -tileSize * 0.2, tileSize * 0.15, tileSize * 0.4);
        }
        ctx.fill();

        ctx.restore();
    }
}

export class PushableBox {
    constructor(startX, startY) {
        this.startX = startX;
        this.startY = startY;

        this.x = startX;
        this.y = startY;

        this.visualX = startX;
        this.visualY = startY;

        this.isAnimating = false;
        this.animProgress = 0;
        this.animSpeed = 0.003;

        this.targetX = startX;
        this.targetY = startY;
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.visualX = this.startX;
        this.visualY = this.startY;
        this.isAnimating = false;
        this.animProgress = 0;
    }

    setTarget(tx, ty) {
        this.x = this.visualX;
        this.y = this.visualY;
        this.targetX = tx;
        this.targetY = ty;
        this.animProgress = 0;
        this.isAnimating = true;
    }

    updateAnimation(dt) {
        if (!this.isAnimating) return;
        this.animProgress += this.animSpeed * dt;
        if (this.animProgress >= 1) {
            this.animProgress = 1;
            this.isAnimating = false;
        }
        this.visualX = this.x + (this.targetX - this.x) * this.animProgress;
        this.visualY = this.y + (this.targetY - this.y) * this.animProgress;
    }

    finishAnimation() {
        this.x = this.targetX;
        this.y = this.targetY;
        this.visualX = this.x;
        this.visualY = this.y;
        this.isAnimating = false;
    }

    draw(ctx, tileSize, offsetX, offsetY) {
        const px = offsetX + this.visualX * tileSize;
        const py = offsetY + this.visualY * tileSize;

        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        // Base metallic block
        ctx.fillStyle = '#445566';
        const padding = tileSize * 0.08;
        if(ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(px + padding, py + padding, tileSize - padding*2, tileSize - padding*2, tileSize * 0.08);
            ctx.fill();
        } else {
            ctx.fillRect(px + padding, py + padding, tileSize - padding*2, tileSize - padding*2);
        }

        // Inner metallic grating
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = '#223344';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const step = tileSize / 5;
        for (let i = 1; i <= 3; i++) {
            ctx.moveTo(px + padding, py + padding + i * step);
            ctx.lineTo(px + tileSize - padding, py + padding + i * step);
            ctx.moveTo(px + padding + i * step, py + padding);
            ctx.lineTo(px + padding + i * step, py + tileSize - padding);
        }
        ctx.stroke();

        // Highlight border
        ctx.strokeStyle = '#667788';
        ctx.lineWidth = 1;
        if(ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(px + padding + 1, py + padding + 1, tileSize - (padding+1)*2, tileSize - (padding+1)*2, tileSize * 0.06);
            ctx.stroke();
        } else {
            ctx.strokeRect(px + padding + 1, py + padding + 1, tileSize - (padding+1)*2, tileSize - (padding+1)*2);
        }
    }
}
