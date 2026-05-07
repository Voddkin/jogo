import { TILE_EMPTY, TILE_WALL, TILE_GATE_RED, TILE_BUTTON } from './entities.js';

export class Renderer {
    constructor(canvasId, game) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { alpha: false }); // Optimize for no transparency on main canvas background
        this.game = game;

        // Multi-Canvas Architecture
        this.layerBackground = document.createElement('canvas');
        this.ctxBg = this.layerBackground.getContext('2d', { willReadFrequently: true });

        this.layerStaticGeometry = document.createElement('canvas');
        this.ctxStatic = this.layerStaticGeometry.getContext('2d', { willReadFrequently: true });

        this.layerLighting = document.createElement('canvas');
        this.ctxLighting = this.layerLighting.getContext('2d');
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;

        // Match offscreen canvases to game map dimensions, not screen dimensions
        // Actually, we can make them match the map exactly: cols * tileSize x rows * tileSize
        // And then drawImage with a source rect based on camera
        // Or make them screen size and redraw entirely? The prompt says "cacheados em memoria".
        // Let's cache the entire map.
    }

    initLevelCache(cols, rows, tileSize) {
        const w = cols * tileSize;
        const h = rows * tileSize;

        this.layerBackground.width = w;
        this.layerBackground.height = h;

        this.layerStaticGeometry.width = w;
        this.layerStaticGeometry.height = h;

        this.layerLighting.width = w;
        this.layerLighting.height = h;

        this.tileSize = tileSize;
        this.mapWidth = w;
        this.mapHeight = h;

        this.fullCacheDraw();
    }

    fullCacheDraw() {
        const time = Date.now(); // We can't animate static cache based on time easily, but prompt says background is static.
        // Wait, rollers are animated. Rollers cannot be in the static cache. They must be drawn in the dynamic layer.
        // We will separate floor (empty, abyss, etc.) to background, and walls to static geometry.

        this.ctxBg.clearRect(0, 0, this.mapWidth, this.mapHeight);
        this.ctxStatic.clearRect(0, 0, this.mapWidth, this.mapHeight);

        // Draw entire map backgrounds
        for (let y = 0; y < this.game.gridMap.rows; y++) {
            for (let x = 0; x < this.game.gridMap.cols; x++) {
                this.drawCachedTile(x, y);
            }
        }
    }

    drawCachedTile(x, y) {
        const px = x * this.tileSize;
        const py = y * this.tileSize;

        const tile = this.game.gridMap.getTile(x, y);

        // Clear both layers for this tile, expanding by 1px to prevent sub-pixel bleeding
        const padding = 1;
        this.ctxBg.clearRect(px - padding, py - padding, this.tileSize + padding * 2, this.tileSize + padding * 2);
        this.ctxStatic.clearRect(px - padding, py - padding, this.tileSize + padding * 2, this.tileSize + padding * 2);

        // --- Background Layer ---
        this.ctxBg.fillStyle = '#111116';
        this.ctxBg.fillRect(px, py, this.tileSize, this.tileSize);

        // Tile specific background
        this.game.gridMap.drawFloorSingle(this.ctxBg, x, y, this.tileSize, 0, 0, 0);

        // --- Static Geometry Layer ---
        if (tile === TILE_WALL || tile === TILE_GATE_RED || tile === TILE_BUTTON) {
            this.game.gridMap.drawWallSingle(this.ctxStatic, x, y, this.tileSize, 0, 0);
        }
    }

    processDirtyRects() {
        const gm = this.game.gridMap;
        if (gm.dirtyCount > 0) {
            for (let i = 0; i < gm.dirtyCount; i++) {
                const x = gm.dirtyRects[i * 2];
                const y = gm.dirtyRects[i * 2 + 1];
                this.drawCachedTile(x, y);
            }
            gm.dirtyCount = 0;
        }
    }

    draw(dt, time) {
        this.processDirtyRects();

        const cam = this.game.camera;
        const ts = this.tileSize;

        // 1. Clear Main Canvas
        this.ctx.fillStyle = '#0a0a0c'; // Base fallback
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();

        // Apply Camera Transform
        this.ctx.translate(-cam.viewportX, -cam.viewportY);

        if (cam.currentOffsetX !== 0 || cam.currentOffsetY !== 0 || cam.currentAngle !== 0) {
            const cx = cam.viewportX + this.canvas.width / 2;
            const cy = cam.viewportY + this.canvas.height / 2;
            this.ctx.translate(cx + cam.currentOffsetX, cy + cam.currentOffsetY);
            this.ctx.rotate(cam.currentAngle);
            this.ctx.translate(-cx, -cy);
        }

        // Viewport bounds for culling
        const vLeft = cam.viewportX - ts;
        const vRight = cam.viewportX + this.canvas.width + ts;
        const vTop = cam.viewportY - ts;
        const vBottom = cam.viewportY + this.canvas.height + ts;

        // 2. Draw Cached Background
        this.ctx.drawImage(this.layerBackground, 0, 0);

        // 3. Draw Dynamic Floor Elements (Animated Rollers, Warps, EMP, Wires, Ribbons)
        // Here we must loop through visible tiles if we want animated floors.
        this.game.gridMap.drawDynamicFloors(this.ctx, ts, 0, 0, time, vLeft, vRight, vTop, vBottom);

        // Draw Wires
        this.game.drawWires(this.ctx, ts, 0, 0);

        // Draw EMP Rings
        this.game.drawEMP(this.ctx, ts, 0, 0, time);

        // Draw Robot Trail
        this.game.robot.drawTrail(this.ctx, ts, 0, 0);

        // 4. Draw Cached Static Geometry (Walls, Shadows)
        this.ctx.drawImage(this.layerStaticGeometry, 0, 0);

        // 5. Draw Dynamic Entities with Y-Sorting
        // Sorting is done in Game Loop
        for (let i = 0, len = this.game.dynamicEntities.length; i < len; i++) {
            const ent = this.game.dynamicEntities[i];
            const px = ent.visualX * ts;
            const py = ent.visualY * ts;

            // Frustum Culling
            if (px >= vLeft && px <= vRight && py >= vTop && py <= vBottom) {
                ent.draw(this.ctx, ts, 0, 0);
            }
        }

        // 6. Draw Particles
        this.game.particlePool.draw(this.ctx, 0, 0, vLeft, vRight, vTop, vBottom);

        this.ctx.restore();

        // 7. Process Lighting Layer (Lasers/Neon Overdraw)
        // Draw to layerLighting, then composite
        this.ctxLighting.clearRect(0, 0, this.mapWidth, this.mapHeight);

        // Isolate lighter composition purely within the lighting layer context
        this.ctxLighting.save();
        this.ctxLighting.globalCompositeOperation = 'lighter';
        this.game.drawLasers(this.ctxLighting, ts, 0, 0);
        this.ctxLighting.restore();

        this.ctx.save();
        // Use a less blowing out composite for the final merge onto the main canvas, and cap alpha
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.globalAlpha = 0.8; // Hard clamp multiplier so crossing lasers don't burn out to pure white

        // We must draw the lighting layer matching the camera transform
        this.ctx.translate(-cam.viewportX, -cam.viewportY);
        if (cam.currentOffsetX !== 0 || cam.currentOffsetY !== 0 || cam.currentAngle !== 0) {
            const cx = cam.viewportX + this.canvas.width / 2;
            const cy = cam.viewportY + this.canvas.height / 2;
            this.ctx.translate(cx + cam.currentOffsetX, cy + cam.currentOffsetY);
            this.ctx.rotate(cam.currentAngle);
            this.ctx.translate(-cx, -cy);
        }

        this.ctx.drawImage(this.layerLighting, 0, 0);
        this.ctx.restore();
    }
}
