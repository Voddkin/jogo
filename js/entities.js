"use strict";
import { Easing, lerp } from './mathUtils.js';
import { MathLUT } from './mathLUT.js';

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
export const TILE_ABYSS = 16;

// Bitmasks for GridMap Uint32Array
export const MASK_ID = 0xFF; // First 8 bits
export const MASK_SOLID = 1 << 8; // Bit 9
export const MASK_TRIGGER = 1 << 9; // Bit 10
export const MASK_CORRUPTED = 1 << 10; // Bit 11
export const MASK_DIRTY = 1 << 11; // Bit 12 for dirty rects tracking

export class GridMap {
    /**
     * @param {Object} parsedData { grid1D, initialBoxes, cols, rows }
     */
    constructor(cols, rows, parsedData) {
        this.cols = cols;
        this.rows = rows;
        this.initialBoxes = parsedData.initialBoxes;
        this.initialGridData = parsedData.grid1D;

        // Fast 1D Uint32Array
        this.grid = new Uint32Array(this.cols * this.rows);
        this.reset();

        this.redGatesOpen = false;
        this.buttonPressed = false;

        // Pre-allocated dirty rects array queue (max capacity = grid size)
        this.dirtyRects = new Uint16Array(this.cols * this.rows * 2); // stores [x,y, x,y...]
        this.dirtyCount = 0;
    }

    getIndex(x, y) {
        return y * this.cols + x;
    }

    findTile(type) {
        const len = this.cols * this.rows;
        for (let i = 0; i < len; i++) {
            if ((this.grid[i] & MASK_ID) === type) {
                return { x: i % this.cols, y: Math.floor(i / this.cols) };
            }
        }
        return null;
    }

    reset() {
        this.grid.set(this.initialGridData);
        this.redGatesOpen = false;
        this.buttonPressed = false;
        this.dirtyCount = 0;
    }

    getTile(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
            return TILE_WALL;
        }
        return this.grid[this.getIndex(x, y)] & MASK_ID;
    }

    setTile(x, y, type) {
        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
            const index = this.getIndex(x, y);

            // Re-evaluate solid mask based on type
            let isSolid = (type === TILE_WALL || type === TILE_HOLE || type === TILE_ABYSS) ? MASK_SOLID : 0;

            // Keep trigger and corrupted state if needed, but normally overwrite
            this.grid[index] = type | isSolid | MASK_DIRTY;

            this.markDirty(x, y);
        }
    }

    markDirty(x, y) {
        // Simple queue addition. To prevent duplicates we could check,
        // but for now simple push is fast.
        this.dirtyRects[this.dirtyCount * 2] = x;
        this.dirtyRects[this.dirtyCount * 2 + 1] = y;
        this.dirtyCount++;
    }

    isWalkable(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return false;

        const index = this.getIndex(x, y);
        const cell = this.grid[index];
        const tile = cell & MASK_ID;

        if ((cell & MASK_SOLID) !== 0) return false;
        if (tile === TILE_GATE_RED && !this.redGatesOpen) return false;

        if (tile === TILE_LASER) {
            let laserActive = !this.buttonPressed;
            if (this.receiversState) {
                for (let i = 0, len = this.receiversState.length; i < len; i++) {
                    const r = this.receiversState[i];
                    if (r.x === x && r.y === y && r.type === 'laser') {
                        laserActive = !r.active;
                        break;
                    }
                }
            }
            if (laserActive) return false;
        }

        return true;
    }

    interact(x, y) {
        const tile = this.getTile(x, y);
        if (tile === TILE_KEY_RED) {
            this.redGatesOpen = true;
            this.setTile(x, y, TILE_EMPTY); // consume key
        }
        // Button is handled by checking if robot is on it or EMP covers it
    }

    drawFloorSingle(ctx, x, y, tileSize, offsetX, offsetY, time = 0) {
        const tile = this.getTile(x, y);
        const px = offsetX + x * tileSize;
        const py = offsetY + y * tileSize;

        if (tile === TILE_ABYSS) {
            ctx.fillStyle = '#020202';
            ctx.fillRect(px, py, tileSize + 0.5, tileSize + 0.5);
            return;
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(px, py, tileSize + 0.5, tileSize + 0.5);

        ctx.strokeStyle = '#2d2d3d';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, tileSize, tileSize);

        if (tile === TILE_KEY_RED) {
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
            ctx.save();
            ctx.globalCompositeOperation = 'overlay';
            ctx.fillStyle = '#e0ffff';
            ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(px + tileSize * 0.2, py + tileSize * 0.2);
            ctx.lineTo(px + tileSize * 0.8, py + tileSize * 0.8);
            ctx.moveTo(px + tileSize * 0.7, py + tileSize * 0.1);
            ctx.lineTo(px + tileSize * 0.1, py + tileSize * 0.9);
            ctx.moveTo(px + tileSize * 0.4, py);
            ctx.lineTo(px + tileSize * 0.4, py + tileSize);
            ctx.stroke();
            ctx.restore();
        } else if (tile === TILE_FRAGILE) {
            ctx.fillStyle = '#3a3a2a';
            ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
            ctx.strokeStyle = '#ff3366';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#ff3366';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.moveTo(px + tileSize * 0.1, py + tileSize * 0.3);
            ctx.lineTo(px + tileSize * 0.4, py + tileSize * 0.5);
            ctx.lineTo(px + tileSize * 0.8, py + tileSize * 0.2);
            ctx.moveTo(px + tileSize * 0.4, py + tileSize * 0.5);
            ctx.lineTo(px + tileSize * 0.6, py + tileSize * 0.9);
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else if (tile === TILE_HOLE) {
            ctx.fillStyle = '#050505';
            ctx.fillRect(px, py, tileSize, tileSize);
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = '#111';
            ctx.strokeRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
        }
    }

    drawWallSingle(ctx, x, y, tileSize, offsetX, offsetY) {
        const tile = this.getTile(x, y);
        const px = offsetX + x * tileSize;
        const py = offsetY + y * tileSize;

        if (tile === TILE_WALL) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 4;

            const gradient = ctx.createLinearGradient(px, py, px, py + tileSize);
            gradient.addColorStop(0, '#5a5a6a');
            gradient.addColorStop(1, '#2a2a35');
            ctx.fillStyle = gradient;
            ctx.fillRect(px, py, tileSize + 0.5, tileSize + 0.5);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fillRect(px, py, tileSize + 0.5, 2);

            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
        } else if (tile === TILE_GATE_RED) {
            ctx.fillStyle = this.redGatesOpen ? '#2a1111' : '#ff2222';
            ctx.fillRect(px, py, tileSize + 0.5, tileSize + 0.5);
            if (!this.redGatesOpen) {
                ctx.strokeStyle = '#550000';
                ctx.lineWidth = 4;
                ctx.strokeRect(px + 4, py + 4, tileSize - 8, tileSize - 8);
                ctx.lineWidth = 1;
            }
        } else if (tile === TILE_BUTTON) {
            let pressed = this.buttonPressed;
            if (this.triggersState) {
                for (let i = 0, len = this.triggersState.length; i < len; i++) {
                    const trig = this.triggersState[i];
                    if (trig.x === x && trig.y === y) {
                        pressed = trig.active;
                        break;
                    }
                }
            }
            const btnColor = pressed ? '#00ffaa' : '#225544';
            ctx.shadowColor = pressed ? '#00ffaa' : 'transparent';
            ctx.shadowBlur = pressed ? 15 : 0;
            ctx.fillStyle = btnColor;
            ctx.beginPath();
            let drawY = py + tileSize / 2;
            if (pressed) drawY += tileSize * 0.05;
            ctx.arc(px + tileSize / 2, drawY, tileSize * 0.24, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        }
    }

    drawDynamicFloors(ctx, tileSize, offsetX, offsetY, time, vLeft, vRight, vTop, vBottom) {
        // Frustum culling limits
        const startX = Math.max(0, Math.floor((vLeft - offsetX) / tileSize));
        const endX = Math.min(this.cols - 1, Math.floor((vRight - offsetX) / tileSize));
        const startY = Math.max(0, Math.floor((vTop - offsetY) / tileSize));
        const endY = Math.min(this.rows - 1, Math.floor((vBottom - offsetY) / tileSize));

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const tile = this.getTile(x, y);
                const px = offsetX + x * tileSize;
                const py = offsetY + y * tileSize;

                if (tile === TILE_ROLLER_RIGHT || tile === TILE_ROLLER_LEFT || tile === TILE_ROLLER_UP || tile === TILE_ROLLER_DOWN) {
                    ctx.fillStyle = '#2a2a35';
                    ctx.fillRect(px, py, tileSize + 0.5, tileSize + 0.5);

                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(px, py, tileSize + 0.5, tileSize + 0.5);
                    ctx.clip();

                    ctx.strokeStyle = '#d97706';
                    ctx.lineWidth = tileSize * 0.15;

                    const speed = 0.05;
                    let offset = (time * speed) % tileSize;

                    ctx.beginPath();
                    if (tile === TILE_ROLLER_RIGHT) {
                        for(let i = -tileSize; i < tileSize * 2; i += tileSize * 0.4) {
                            ctx.moveTo(px + i + offset, py);
                            ctx.lineTo(px + i + offset, py + tileSize);
                        }
                    } else if (tile === TILE_ROLLER_LEFT) {
                        for(let i = -tileSize; i < tileSize * 2; i += tileSize * 0.4) {
                            ctx.moveTo(px + i - offset, py);
                            ctx.lineTo(px + i - offset, py + tileSize);
                        }
                    } else if (tile === TILE_ROLLER_UP) {
                        for(let i = -tileSize; i < tileSize * 2; i += tileSize * 0.4) {
                            ctx.moveTo(px, py + i - offset);
                            ctx.lineTo(px + tileSize, py + i - offset);
                        }
                    } else if (tile === TILE_ROLLER_DOWN) {
                        for(let i = -tileSize; i < tileSize * 2; i += tileSize * 0.4) {
                            ctx.moveTo(px, py + i + offset);
                            ctx.lineTo(px + tileSize, py + i + offset);
                        }
                    }
                    ctx.stroke();
                    ctx.restore();
                } else if (tile === TILE_WARP_A || tile === TILE_WARP_B) {
                    const color = tile === TILE_WARP_A ? '#a855f7' : '#ff00aa';

                    ctx.save();
                    ctx.globalCompositeOperation = 'screen';
                    ctx.translate(px + tileSize / 2, py + tileSize / 2);
                    ctx.rotate(time * 0.001);

                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 15;

                    ctx.beginPath();
                    for(let theta = 0; theta <= 4 * Math.PI; theta += 0.1) {
                        const r = (theta / (4 * Math.PI)) * (tileSize / 2 - 2);
                        const sx = r * MathLUT.cos(theta);
                        const sy = r * MathLUT.sin(theta);
                        if (theta === 0) ctx.moveTo(sx, sy);
                        else ctx.lineTo(sx, sy);
                    }
                    ctx.stroke();

                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(0, 0, tileSize * 0.1, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
        }
    }
}

export class DynamicEntity {
    constructor(startX, startY) {
        this.startX = startX;
        this.startY = startY;

        this.x = startX;
        this.y = startY;

        this.visualX = startX;
        this.visualY = startY;

        this.scaleX = 1.0;
        this.scaleY = 1.0;

        this.isAnimating = false;
        this.animProgress = 0;
        this.animSpeed = 0.003;

        this.targetX = startX;
        this.targetY = startY;

        this.moveType = 'IDLE';
        this.time = 0;

        // Internal physics state for autonomous movement
        this.physicsState = 'IDLE';
        this.lastDx = 0;
        this.lastDy = 0;
    }

    setTarget(tx, ty, moveType = 'MOVE') {
        this.lastDx = Math.sign(tx - this.x);
        this.lastDy = Math.sign(ty - this.y);

        this.x = this.visualX;
        this.y = this.visualY;
        this.targetX = tx;
        this.targetY = ty;
        this.moveType = moveType;
        this.animProgress = 0;
        this.isAnimating = true;
    }
}

export class Robot extends DynamicEntity {
    constructor(startX, startY, startDir) {
        super(startX, startY);

        this.startDir = startDir;
        this.dir = startDir;
        this.empActive = false;

        this.visualDir = startDir;
        this.targetDir = startDir;

        this.trailHistory = [];
        this.maxTrailLength = 15;
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.dir = this.startDir;
        this.empActive = false;

        this.visualX = this.startX;
        this.visualY = this.startY;
        this.visualDir = this.startDir;

        this.scaleX = 1.0;
        this.scaleY = 1.0;

        this.isAnimating = false;
        this.animProgress = 0;
        this.moveType = 'IDLE';
    }

    updateAnimation(dt) {
        this.time += dt;

        // Trail Collection
        if (this.isAnimating || this.moveType !== 'IDLE') {
            this.trailHistory.push({
                x: this.visualX,
                y: this.visualY,
                timestamp: this.time
            });
            if (this.trailHistory.length > this.maxTrailLength) {
                this.trailHistory.shift();
            }
        } else if (this.trailHistory.length > 0) {
            // Evaporate trail
            this.trailHistory.shift();
        }

        if (!this.isAnimating) return;

        this.animProgress += this.animSpeed * dt;
        let p = this.animProgress;

        if (this.animProgress >= 1) {
            this.animProgress = 1;
            p = 1.0;
            this.isAnimating = false;
        }

        if (this.moveType === 'MOVE' || this.moveType === 'PUSH') {
            const easeP = this.moveType === 'PUSH' ? Easing.easeInCubic(p) : Easing.easeInOutQuad(p);
            this.visualX = lerp(this.x, this.targetX, easeP);
            this.visualY = lerp(this.y, this.targetY, easeP);

            // Squash & Stretch
            if (p < 0.5) {
                // Acceleration: Stretch
                const stretchP = Easing.easeInQuad(p * 2); // 0 to 1
                this.scaleX = lerp(1.0, 1.2, stretchP);
                this.scaleY = lerp(1.0, 0.8, stretchP);
            } else if (p < 0.8) {
                // Deceleration: Squash
                const squashP = (p - 0.5) / 0.3; // 0 to 1
                this.scaleX = lerp(1.2, 0.7, Easing.easeOutQuad(squashP));
                this.scaleY = lerp(0.8, 1.3, Easing.easeOutQuad(squashP));
            } else {
                // Resting: Elastic return
                const restP = (p - 0.8) / 0.2; // 0 to 1
                this.scaleX = lerp(0.7, 1.0, Easing.easeOutElastic(restP));
                this.scaleY = lerp(1.3, 1.0, Easing.easeOutElastic(restP));
            }
        } else if (this.moveType === 'BUMP') {
            // Move half a tile and return
            const easeP = p < 0.5 ? Easing.easeOutQuad(p * 2) : Easing.easeOutQuad(1 - (p - 0.5) * 2);
            // targetX/targetY holds the wall position
            const halfX = this.x + (this.targetX - this.x) * 0.4;
            const halfY = this.y + (this.targetY - this.y) * 0.4;

            this.visualX = lerp(this.x, halfX, easeP);
            this.visualY = lerp(this.y, halfY, easeP);

            if (p < 0.5) {
                this.scaleX = lerp(1.0, 0.6, p * 2);
                this.scaleY = lerp(1.0, 1.4, p * 2);
            } else {
                this.scaleX = lerp(0.6, 1.0, (p - 0.5) * 2);
                this.scaleY = lerp(1.4, 1.0, (p - 0.5) * 2);
            }
        } else if (this.moveType === 'TURN') {
            const easeP = Easing.easeOutBack(p);
            let diff = this.targetDir - this.dir;
            if (diff > 2) diff -= 4;
            if (diff < -2) diff += 4;
            this.visualDir = this.dir + diff * easeP;
        } else {
            this.visualX = lerp(this.x, this.targetX, p);
            this.visualY = lerp(this.y, this.targetY, p);
            let diff = this.targetDir - this.dir;
            if (diff > 2) diff -= 4;
            if (diff < -2) diff += 4;
            this.visualDir = this.dir + diff * p;
        }
    }

    finishAnimation() {
        if (this.moveType !== 'BUMP') {
            this.x = this.targetX;
            this.y = this.targetY;
            // normalize dir
            this.dir = (this.targetDir % 4 + 4) % 4;
        }

        this.visualX = this.x;
        this.visualY = this.y;
        this.visualDir = this.dir;

        this.scaleX = 1.0;
        this.scaleY = 1.0;

        this.isAnimating = false;
        this.moveType = 'IDLE';
    }

    setTarget(tx, ty, tdir, moveType = 'MOVE') {
        this.x = this.visualX;
        this.y = this.visualY;
        this.dir = this.visualDir;
        this.targetX = tx;
        this.targetY = ty;
        this.targetDir = tdir;
        this.moveType = moveType;
        this.animProgress = 0;
        this.isAnimating = true;
    }

    drawTrail(ctx, tileSize, offsetX, offsetY) {
        if (this.trailHistory.length < 2) return;

        ctx.save();

        let baseColor = this.empActive ? '0, 230, 255' : '255, 107, 0';
        if (this.moveType === 'PUSH') baseColor = '255, 0, 0'; // Red trail for pushing

        ctx.globalCompositeOperation = 'screen';

        for (let i = 0; i < this.trailHistory.length - 1; i++) {
            const p1 = this.trailHistory[i];
            const p2 = this.trailHistory[i + 1];

            const px1 = offsetX + p1.x * tileSize + tileSize / 2;
            const py1 = offsetY + p1.y * tileSize + tileSize / 2;
            const px2 = offsetX + p2.x * tileSize + tileSize / 2;
            const py2 = offsetY + p2.y * tileSize + tileSize / 2;

            const progress = i / this.maxTrailLength;
            let widthMod = this.moveType === 'PUSH' ? 0.8 : 0.4;
            ctx.lineWidth = tileSize * widthMod * progress;
            ctx.strokeStyle = `rgba(${baseColor}, ${progress * 0.8})`;

            ctx.beginPath();
            ctx.moveTo(px1, py1);
            ctx.lineTo(px2, py2);
            ctx.stroke();
        }
        ctx.restore();
    }

    draw(ctx, tileSize, offsetX, offsetY) {
        const px = offsetX + this.visualX * tileSize + tileSize / 2;
        const py = offsetY + this.visualY * tileSize + tileSize / 2;
        const rotation = this.visualDir * Math.PI / 2;

        const baseColor = this.empActive ? '#00e6ff' : '#FF6B00';
        const darkColor = this.empActive ? '#0088aa' : '#B34A00';
        const visorColor = this.empActive ? '#ffffff' : '#00ffff';

        ctx.save();

        // Translate to Center
        ctx.translate(px, py);

        // Idle Trigonometry: Hover
        let hoverY = MathLUT.sin(this.time * 0.003) * 4;

        // Anti-Grav Base (Draw BEFORE Hover Translate so it stays on floor)
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const radGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, tileSize * 0.6);
        radGrad.addColorStop(0, `rgba(0, 255, 255, 0.4)`);
        radGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        // Draw flattened ellipse
        ctx.scale(1, 0.5);
        ctx.arc(0, 0, tileSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Apply Hover Translation
        ctx.translate(0, hoverY);

        // Apply Rotation
        ctx.rotate(rotation);

        // Idle Trigonometry: Breathing Squash/Stretch combined with Kinematics
        let breathScaleX = 1 + MathLUT.cos(this.time * 0.002) * 0.02;
        let breathScaleY = 1 + MathLUT.sin(this.time * 0.002) * 0.03;
        ctx.scale(this.scaleX * breathScaleX, this.scaleY * breathScaleY);

        // Cyber-Ears
        ctx.fillStyle = '#1f1f2e';
        ctx.beginPath();
        // Left Ear
        ctx.moveTo(-tileSize * 0.2, -tileSize * 0.35);
        ctx.lineTo(-tileSize * 0.35, -tileSize * 0.5);
        ctx.lineTo(-tileSize * 0.4, -tileSize * 0.2);
        // Right Ear
        ctx.moveTo(-tileSize * 0.2, tileSize * 0.35);
        ctx.lineTo(-tileSize * 0.35, tileSize * 0.5);
        ctx.lineTo(-tileSize * 0.4, tileSize * 0.2);
        ctx.fill();

        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.moveTo(-tileSize * 0.22, -tileSize * 0.32);
        ctx.lineTo(-tileSize * 0.32, -tileSize * 0.45);
        ctx.lineTo(-tileSize * 0.36, -tileSize * 0.22);

        ctx.moveTo(-tileSize * 0.22, tileSize * 0.32);
        ctx.lineTo(-tileSize * 0.32, tileSize * 0.45);
        ctx.lineTo(-tileSize * 0.36, tileSize * 0.22);
        ctx.fill();

        // Cyber-Fox Chassis (Inverted Trapezoid)
        const bodyGrad = ctx.createLinearGradient(-tileSize * 0.35, 0, tileSize * 0.35, 0);
        bodyGrad.addColorStop(0, darkColor);
        bodyGrad.addColorStop(1, baseColor);
        ctx.fillStyle = bodyGrad;

        ctx.beginPath();
        // Back Top, Back Bottom, Front Bottom, Front Top
        ctx.moveTo(-tileSize * 0.35, -tileSize * 0.3);
        ctx.arcTo(-tileSize * 0.35, tileSize * 0.3, tileSize * 0.35, tileSize * 0.2, tileSize * 0.1);
        ctx.arcTo(tileSize * 0.35, tileSize * 0.2, tileSize * 0.35, -tileSize * 0.2, tileSize * 0.15);
        ctx.arcTo(tileSize * 0.35, -tileSize * 0.2, -tileSize * 0.35, -tileSize * 0.3, tileSize * 0.15);
        ctx.arcTo(-tileSize * 0.35, -tileSize * 0.3, -tileSize * 0.35, tileSize * 0.3, tileSize * 0.1);
        ctx.fill();

        // Daft Punk Visor
        ctx.fillStyle = '#0a0a0c';
        ctx.beginPath();
        ctx.moveTo(tileSize * 0.1, -tileSize * 0.25);
        ctx.lineTo(tileSize * 0.38, -tileSize * 0.15);
        ctx.lineTo(tileSize * 0.38, tileSize * 0.15);
        ctx.lineTo(tileSize * 0.1, tileSize * 0.25);
        ctx.fill();

        // Glowing LEDs
        let visorAlpha = 0.6 + MathLUT.sin(this.time * 0.01) * 0.4;
        ctx.globalAlpha = visorAlpha;
        ctx.shadowColor = visorColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = visorColor;

        ctx.beginPath();
        ctx.arc(tileSize * 0.25, 0, tileSize * 0.04, 0, Math.PI * 2);
        ctx.arc(tileSize * 0.25, -tileSize * 0.08, tileSize * 0.04, 0, Math.PI * 2);
        ctx.arc(tileSize * 0.25, tileSize * 0.08, tileSize * 0.04, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class PushableBox extends DynamicEntity {
    constructor(startX, startY) {
        super(startX, startY);
        this.id = 'box_' + Math.random().toString(36).substr(2, 9);
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.visualX = this.startX;
        this.visualY = this.startY;
        this.isAnimating = false;
        this.animProgress = 0;
        this.scaleX = 1.0;
        this.scaleY = 1.0;
        this.moveType = 'IDLE';
        this.physicsState = 'IDLE';
    }

    updateAnimation(dt) {
        this.time += dt;
        if (!this.isAnimating) return;
        this.animProgress += this.animSpeed * dt;
        let p = this.animProgress;
        if (this.animProgress >= 1) {
            this.animProgress = 1;
            p = 1.0;
            this.isAnimating = false;
        }

        const easeP = this.moveType === 'PUSH' ? Easing.easeInCubic(p) : Easing.easeInOutQuad(p);
        this.visualX = lerp(this.x, this.targetX, easeP);
        this.visualY = lerp(this.y, this.targetY, easeP);

        // Falling animation if going into abyss
        if (this.physicsState === 'FALLING') {
            this.scaleX = lerp(1.0, 0.0, p);
            this.scaleY = lerp(1.0, 0.0, p);
        }
    }

    finishAnimation() {
        this.x = this.targetX;
        this.y = this.targetY;
        this.visualX = this.x;
        this.visualY = this.y;
        this.isAnimating = false;
        this.moveType = 'IDLE';
    }

    draw(ctx, tileSize, offsetX, offsetY) {
        let px = offsetX + this.visualX * tileSize + tileSize / 2;
        let py = offsetY + this.visualY * tileSize + tileSize / 2;

        ctx.save();
        ctx.translate(px, py);
        ctx.scale(this.scaleX, this.scaleY);

        // Shadow
        ctx.shadowColor = 'rgba(20, 10, 30, 0.7)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 8;

        const w = tileSize * 0.8;
        const h = tileSize * 0.8;

        // Server Cluster Metallic Gradient
        const grad = ctx.createLinearGradient(-w/2, -h/2, w/2, h/2);
        grad.addColorStop(0, '#222');
        grad.addColorStop(1, '#111');

        ctx.fillStyle = grad;
        if(ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(-w/2, -h/2, w, h, w * 0.1);
            ctx.fill();
        } else {
            ctx.fillRect(-w/2, -h/2, w, h);
        }

        ctx.shadowColor = 'transparent';

        // Pseudo-3D Bevel Highlight
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-w/2 + 2, h/2 - 4);
        ctx.lineTo(-w/2 + 2, -h/2 + 2);
        ctx.lineTo(w/2 - 4, -h/2 + 2);
        ctx.stroke();

        // Server LEDs
        const ledW = w * 0.15;
        const ledH = h * 0.06;
        for (let i = 0; i < 5; i++) {
            let ledY = -h/2 + h * 0.2 + (i * h * 0.12);

            // Unintentional Movement Alarm (Red) vs Normal (Green)
            const isAlarm = this.moveType === 'PUSH' || this.physicsState !== 'IDLE';
            let color = isAlarm ? '#ff0000' : '#00ff00';

            // Blinking
            if (i % 2 === 0) {
                // generate a pseudo-random stable frequency based on id characters
                const idVal = this.id.charCodeAt(4) || 1;
                const alpha = (MathLUT.sin(this.time * 0.005 * idVal) + 1) / 2;
                ctx.globalAlpha = 0.3 + alpha * 0.7;
            } else {
                ctx.globalAlpha = 1.0;
            }

            ctx.shadowColor = color;
            ctx.shadowBlur = 5;
            ctx.fillStyle = color;
            ctx.fillRect(-w * 0.3, ledY, ledW, ledH);
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }
}
