import { GridMap, Robot, PushableBox, TILE_BUTTON, TILE_EXIT, TILE_WARP_A, TILE_WARP_B, TILE_ICE, TILE_ROLLER_RIGHT, TILE_ROLLER_LEFT, TILE_ROLLER_UP, TILE_ROLLER_DOWN, TILE_FRAGILE, TILE_HOLE } from './entities.js';
import { LEVEL_DATABASE } from './levels.js';
import { LevelParser } from './levelParser.js';
import { UIManager } from './uiManager.js';
import { Camera } from './camera.js';
import { ParticlePool } from './particles.js';

const GAME_STATES = Object.freeze({
    IDLE: 'IDLE',
    EXECUTING: 'EXECUTING',
    ANIMATING: 'ANIMATING',
    LEVEL_COMPLETE: 'LEVEL_COMPLETE',
    FAILED: 'FAILED'
});

export class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.wrapper = document.getElementById('canvas-wrapper');

        this.state = GAME_STATES.IDLE;
        this.currentLevelIndex = 0;

        this.commandQueue = [];
        this.executionQueue = []; // Working copy of the queue during execution
        this.uiExecIndex = 0;

        this.lastTime = 0;

        this.tileSize = 50;
        this.offsetX = 0;
        this.offsetY = 0;

        // Resize observer for responsive canvas
        this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
        this.resizeObserver.observe(this.wrapper);

        // Initialize UI Manager
        this.uiManager = new UIManager(this);

        // Initialize Camera and Particles
        this.camera = new Camera();
        this.particlePool = new ParticlePool(1000);

        this.empRings = []; // For EMP shockwave rings

        // Initial setup
        this.resizeCanvas();
        this.loadLevel(this.currentLevelIndex);

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    resizeCanvas() {
        // Native pixels for crispness
        const rect = this.wrapper.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.calculateGridMetrics();
    }

    calculateGridMetrics() {
        if (!this.gridMap) return;

        // Calculate max tile size that fits in both dimensions
        const maxTileWidth = this.canvas.width / this.gridMap.cols;
        const maxTileHeight = this.canvas.height / this.gridMap.rows;

        // Limit max size so it doesn't look absurdly huge on wide screens, but fills available space
        this.tileSize = Math.floor(Math.min(maxTileWidth, maxTileHeight) * 0.9);

        const totalGridWidth = this.gridMap.cols * this.tileSize;
        const totalGridHeight = this.gridMap.rows * this.tileSize;

        this.offsetX = (this.canvas.width - totalGridWidth) / 2;
        this.offsetY = (this.canvas.height - totalGridHeight) / 2;
    }

    loadLevel(index) {
        if (index >= LEVEL_DATABASE.length) {
            alert("Congratulations! All levels completed.");
            return;
        }

        this.currentLevelIndex = index;
        const levelData = LEVEL_DATABASE[index];

        document.getElementById('level-name').innerText = levelData.name;

        const parsedData = LevelParser.parse(levelData);
        this.gridMap = new GridMap(levelData.grid.width, levelData.grid.height, parsedData);
        this.robot = new Robot(levelData.spawn.x, levelData.spawn.y, levelData.spawn.direction);
        this.boxes = parsedData.initialBoxes.map(pos => new PushableBox(pos.x, pos.y));

        this.calculateGridMetrics();

        // Reset command queue completely
        this.commandQueue = [];
        this.executionQueue = [];
        this.uiExecIndex = 0;
        this.uiManager.clearTimeline(); // Trigger animations to wipe

        this.state = GAME_STATES.IDLE;
        this.uiManager.updateStateStatus(this.state);
        document.getElementById('overlay-message').classList.add('hidden');
        this.updateMapInteractions(this.robot.x, this.robot.y);
    }

    resetLevel() {
        if (this.state === GAME_STATES.LEVEL_COMPLETE) return;

        this.gridMap.reset();
        this.robot.reset();
        this.boxes.forEach(box => box.reset());
        this.uiManager.resetHighlights();
        this.state = GAME_STATES.IDLE;
        this.uiManager.updateStateStatus(this.state);
        this.updateMapInteractions(this.robot.x, this.robot.y);
    }

    addCommand(cmd) {
        if (this.state !== GAME_STATES.IDLE) return;
        if (this.commandQueue.filter(c => !c.startsWith('SYS_')).length >= this.uiManager.MAX_COMMANDS) return;

        this.commandQueue.push(cmd);
        this.uiManager.syncTimeline(this.commandQueue);
    }

    removeCommandAt(index) {
        if (this.state !== GAME_STATES.IDLE) return;
        if (index >= 0 && index < this.commandQueue.length) {
            this.commandQueue.splice(index, 1);
            this.uiManager.removeBlock(index);
        }
    }

    clearQueue() {
        if (this.state !== GAME_STATES.IDLE && this.state !== GAME_STATES.FAILED) return;
        this.commandQueue = [];
        this.uiManager.clearTimeline();
    }

    executeQueue() {
        if (this.state !== GAME_STATES.IDLE) return;
        if (this.commandQueue.length === 0) {
            this.uiManager.triggerErrorShake();
            return;
        }

        this.executionQueue = [...this.commandQueue];
        this.uiExecIndex = 0;

        this.state = GAME_STATES.EXECUTING;
        this.uiManager.updateStateStatus(this.state);
        this.uiManager.highlightExecutingBlock(this.uiExecIndex);
    }

    getBoxAt(x, y) {
        return this.boxes.find(box => box.x === x && box.y === y);
    }

    processLogicalCommand() {
        if (this.executionQueue.length === 0) {
            this.state = GAME_STATES.IDLE;
            return;
        }

        const currentTileBefore = this.gridMap.getTile(this.robot.x, this.robot.y);

        // Ice mechanics: skip queue read if sliding
        let cmd;
        if (currentTileBefore === TILE_ICE && this.executionQueue[0] !== 'SYS_SLIDE_FORWARD' && this.executionQueue[0] !== 'SYS_SLIDE_BACKWARD') {
            // We shouldn't be here, but if we are on ice and no slide command is queued, we force one
            cmd = 'SYS_SLIDE_FORWARD';
            this.executionQueue.unshift(cmd);
        } else {
            cmd = this.executionQueue.shift();
        }

        if (!cmd.startsWith('SYS_') && cmd !== 'NEXT_LEVEL') {
            this.uiManager.highlightExecutingBlock(this.uiExecIndex);
            this.uiExecIndex++;
        }

        let tx = this.robot.x;
        let ty = this.robot.y;
        let tdir = this.robot.dir;

        const dx = [1, 0, -1, 0];
        const dy = [0, 1, 0, -1];

        const currentTileType = this.gridMap.getTile(tx, ty);

        const tryMove = (nx, ny, dirX, dirY) => {
            const box = this.getBoxAt(nx, ny);
            if (box) {
                const nnx = nx + dirX;
                const nny = ny + dirY;
                if (this.gridMap.isWalkable(nnx, nny) && !this.getBoxAt(nnx, nny)) {
                    box.setTarget(nnx, nny);
                    return true;
                }
                return false;
            } else if (this.gridMap.isWalkable(nx, ny)) {
                return true;
            }
            return false;
        };

        let moveType = 'IDLE';

        if (cmd === 'MOVE_FORWARD' || cmd === 'SYS_SLIDE_FORWARD') {
            const nx = tx + dx[tdir];
            const ny = ty + dy[tdir];
            if (tryMove(nx, ny, dx[tdir], dy[tdir])) {
                tx = nx;
                ty = ny;
                moveType = 'MOVE';
            } else if (cmd === 'MOVE_FORWARD') {
                // Collision / Bump
                tx = nx;
                ty = ny;
                moveType = 'BUMP';
                this.camera.addTrauma(0.35);

                // Spawn particles
                for (let i = 0; i < 15; i++) {
                    const vx = -dx[tdir] * (Math.random() * 0.5 + 0.5) + (Math.random() * 0.4 - 0.2);
                    const vy = -dy[tdir] * (Math.random() * 0.5 + 0.5) + (Math.random() * 0.4 - 0.2);
                    this.particlePool.spawn(
                        this.robot.visualX * this.tileSize + this.tileSize / 2,
                        this.robot.visualY * this.tileSize + this.tileSize / 2,
                        vx, vy, Math.random() * 3 + 2, '#ffcc00', 300
                    );
                }

                // Set UI block to error
                const blocks = document.querySelectorAll('.cmd-block');
                if (this.uiExecIndex - 1 >= 0 && this.uiExecIndex - 1 < blocks.length) {
                    blocks[this.uiExecIndex - 1].classList.add('is-error');
                }
            }
        } else if (cmd === 'MOVE_BACKWARD' || cmd === 'SYS_SLIDE_BACKWARD') {
            const nx = tx - dx[tdir];
            const ny = ty - dy[tdir];
            if (tryMove(nx, ny, -dx[tdir], -dy[tdir])) {
                tx = nx;
                ty = ny;
                moveType = 'MOVE';
            } else if (cmd === 'MOVE_BACKWARD') {
                tx = nx;
                ty = ny;
                moveType = 'BUMP';
                this.camera.addTrauma(0.35);
                for (let i = 0; i < 15; i++) {
                    const vx = dx[tdir] * (Math.random() * 0.5 + 0.5) + (Math.random() * 0.4 - 0.2);
                    const vy = dy[tdir] * (Math.random() * 0.5 + 0.5) + (Math.random() * 0.4 - 0.2);
                    this.particlePool.spawn(
                        this.robot.visualX * this.tileSize + this.tileSize / 2,
                        this.robot.visualY * this.tileSize + this.tileSize / 2,
                        vx, vy, Math.random() * 3 + 2, '#ffcc00', 300
                    );
                }
                const blocks = document.querySelectorAll('.cmd-block');
                if (this.uiExecIndex - 1 >= 0 && this.uiExecIndex - 1 < blocks.length) {
                    blocks[this.uiExecIndex - 1].classList.add('is-error');
                }
            }
        } else if (cmd === 'SYS_FORCE_E') {
            if (tryMove(tx + 1, ty, 1, 0)) { tx += 1; moveType = 'MOVE'; }
        } else if (cmd === 'SYS_FORCE_S') {
            if (tryMove(tx, ty + 1, 0, 1)) { ty += 1; moveType = 'MOVE'; }
        } else if (cmd === 'SYS_FORCE_W') {
            if (tryMove(tx - 1, ty, -1, 0)) { tx -= 1; moveType = 'MOVE'; }
        } else if (cmd === 'SYS_FORCE_N') {
            if (tryMove(tx, ty - 1, 0, -1)) { ty -= 1; moveType = 'MOVE'; }
        } else if (cmd === 'TURN_RIGHT') {
            tdir = (tdir + 1) % 4;
            moveType = 'TURN';
        } else if (cmd === 'TURN_LEFT') {
            tdir = (tdir + 3) % 4;
            moveType = 'TURN';
        } else if (cmd === 'ACTIVATE_EMP') {
            this.robot.empActive = !this.robot.empActive;

            // EMP Visuals
            this.camera.addTrauma(0.6);
            for (let i = 0; i < 50; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 0.5 + 0.2;
                this.particlePool.spawn(
                    this.robot.visualX * this.tileSize + this.tileSize / 2,
                    this.robot.visualY * this.tileSize + this.tileSize / 2,
                    Math.cos(angle) * speed, Math.sin(angle) * speed,
                    Math.random() * 2 + 1, '#00ffff', 400
                );
            }
            this.empRings.push({
                x: this.robot.visualX * this.tileSize + this.tileSize / 2,
                y: this.robot.visualY * this.tileSize + this.tileSize / 2,
                radius: this.tileSize * 0.5,
                maxRadius: this.tileSize * 3,
                life: 400,
                maxLife: 400
            });

            this.updateMapInteractions(tx, ty);
        }

        const moved = (tx !== this.robot.x || ty !== this.robot.y) && moveType !== 'BUMP';

        if (moved && currentTileType === TILE_FRAGILE) {
            this.gridMap.setTile(this.robot.x, this.robot.y, TILE_HOLE);
        }

        this.robot.setTarget(tx, ty, tdir, moveType);

        if (moved) {
            this.gridMap.interact(tx, ty);
        }

        const newTileType = this.gridMap.getTile(tx, ty);

        if (cmd === 'NEXT_LEVEL') {
            this.state = GAME_STATES.LEVEL_COMPLETE;
            this.uiManager.updateStateStatus(this.state);
            document.getElementById('overlay-message').classList.remove('hidden');
            return;
        } else if (newTileType === TILE_EXIT && !this.executionQueue.includes('NEXT_LEVEL')) {
            this.executionQueue = ['NEXT_LEVEL'];
        }

        // Warp handling (instant logical position swap)
        if (newTileType === TILE_WARP_A && moved) {
            const warpB = this.gridMap.findTile(TILE_WARP_B);
            if (warpB) {
                this.robot.visualX = warpB.x;
                this.robot.visualY = warpB.y;
                this.robot.x = warpB.x;
                this.robot.y = warpB.y;
                tx = warpB.x;
                ty = warpB.y;
                this.robot.setTarget(tx, ty, tdir);
                this.robot.finishAnimation();
            }
        } else if (newTileType === TILE_WARP_B && moved) {
            const warpA = this.gridMap.findTile(TILE_WARP_A);
            if (warpA) {
                this.robot.visualX = warpA.x;
                this.robot.visualY = warpA.y;
                this.robot.x = warpA.x;
                this.robot.y = warpA.y;
                tx = warpA.x;
                ty = warpA.y;
                this.robot.setTarget(tx, ty, tdir);
                this.robot.finishAnimation();
            }
        }

        const finalTileType = this.gridMap.getTile(tx, ty);

        if (finalTileType === TILE_ICE) {
            // Ice sliding particles
            if (moveType === 'MOVE') {
                for (let i = 0; i < 5; i++) {
                    const vx = -dx[tdir] * (Math.random() * 0.2) + (Math.random() * 0.1 - 0.05);
                    const vy = -dy[tdir] * (Math.random() * 0.2) + (Math.random() * 0.1 - 0.05);
                    this.particlePool.spawn(
                        this.robot.visualX * this.tileSize + this.tileSize / 2,
                        this.robot.visualY * this.tileSize + this.tileSize / 2,
                        vx, vy, Math.random() * 2 + 1, '#e0ffff', 200
                    );
                }
            }
            if (cmd === 'MOVE_FORWARD' || cmd === 'SYS_SLIDE_FORWARD') {
                if (this.gridMap.isWalkable(tx + dx[tdir], ty + dy[tdir])) {
                    this.executionQueue.unshift('SYS_SLIDE_FORWARD');
                }
            } else if (cmd === 'MOVE_BACKWARD' || cmd === 'SYS_SLIDE_BACKWARD') {
                if (this.gridMap.isWalkable(tx - dx[tdir], ty - dy[tdir])) {
                    this.executionQueue.unshift('SYS_SLIDE_BACKWARD');
                }
            }
        }

        if (finalTileType === TILE_ROLLER_RIGHT) {
            if (this.gridMap.isWalkable(tx + 1, ty)) this.executionQueue.unshift('SYS_FORCE_E');
        } else if (finalTileType === TILE_ROLLER_DOWN) {
            if (this.gridMap.isWalkable(tx, ty + 1)) this.executionQueue.unshift('SYS_FORCE_S');
        } else if (finalTileType === TILE_ROLLER_LEFT) {
            if (this.gridMap.isWalkable(tx - 1, ty)) this.executionQueue.unshift('SYS_FORCE_W');
        } else if (finalTileType === TILE_ROLLER_UP) {
            if (this.gridMap.isWalkable(tx, ty - 1)) this.executionQueue.unshift('SYS_FORCE_N');
        }

        this.updateMapInteractions(tx, ty);
        this.state = GAME_STATES.ANIMATING;
    }

    updateMapInteractions(x, y) {
        let buttonPressed = false;
        let buttonX = -1, buttonY = -1;

        if (this.gridMap.getTile(x, y) === TILE_BUTTON) {
            buttonPressed = true;
            buttonX = x; buttonY = y;
        }

        for (const box of this.boxes) {
            if (this.gridMap.getTile(box.targetX, box.targetY) === TILE_BUTTON) {
                buttonPressed = true;
                buttonX = box.targetX; buttonY = box.targetY;
            }
        }

        if (this.robot.empActive) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (this.gridMap.getTile(x + dx, y + dy) === TILE_BUTTON) {
                        buttonPressed = true;
                        buttonX = x + dx; buttonY = y + dy;
                    }
                }
            }
        }

        if (buttonPressed && !this.gridMap.buttonPressed) {
            // Just pressed
            for (let i = 0; i < 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 0.15 + 0.05;
                this.particlePool.spawn(
                    buttonX * this.tileSize + this.tileSize / 2,
                    buttonY * this.tileSize + this.tileSize / 2,
                    Math.cos(angle) * speed, Math.sin(angle) * speed,
                    Math.random() * 2 + 1, '#00ffaa', 300
                );
            }
        }

        this.gridMap.buttonPressed = buttonPressed;
    }

    gameLoop(timestamp) {
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(dt);
        this.render();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(dt) {
        this.camera.update(dt);
        this.particlePool.update(dt);

        // Update EMP rings
        for (let i = this.empRings.length - 1; i >= 0; i--) {
            let ring = this.empRings[i];
            ring.life -= dt;
            if (ring.life <= 0) {
                this.empRings.splice(i, 1);
            } else {
                const p = 1 - (ring.life / ring.maxLife);
                ring.radius = ring.maxRadius * Math.pow(p, 0.5); // non-linear expansion
            }
        }

        switch(this.state) {
            case GAME_STATES.IDLE:
                // Just waiting for user interaction
                break;

            case GAME_STATES.EXECUTING:
                this.processLogicalCommand();
                break;

            case GAME_STATES.ANIMATING:
                let isAnyAnimating = false;

                if (this.robot.isAnimating) {
                    this.robot.updateAnimation(dt);
                    isAnyAnimating = true;
                    if (!this.robot.isAnimating) {
                        this.robot.finishAnimation();
                    }
                }

                for (const box of this.boxes) {
                    if (box.isAnimating) {
                        box.updateAnimation(dt);
                        isAnyAnimating = true;
                        if (!box.isAnimating) {
                            box.finishAnimation();
                        }
                    }
                }

                if (!isAnyAnimating) {
                    if (this.executionQueue.length === 0 && this.state !== GAME_STATES.LEVEL_COMPLETE) {
                        this.state = GAME_STATES.IDLE;
                        this.uiManager.updateStateStatus(this.state);
                    } else {
                        // Transition back to executing next command
                        this.state = GAME_STATES.EXECUTING;
                    }
                }
                break;

            case GAME_STATES.LEVEL_COMPLETE:
                // Wait for user to click next level button on overlay
                break;
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.gridMap) return;

        this.ctx.save();
        this.camera.applyTransform(this.ctx, this.canvas.width, this.canvas.height);

        this.gridMap.draw(this.ctx, this.tileSize, this.offsetX, this.offsetY);
        for (const box of this.boxes) {
            box.draw(this.ctx, this.tileSize, this.offsetX, this.offsetY);
        }

        // Draw EMP rings
        for (const ring of this.empRings) {
            this.ctx.beginPath();
            this.ctx.arc(this.offsetX + ring.x, this.offsetY + ring.y, ring.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(0, 255, 255, ${ring.life / ring.maxLife})`;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }

        this.robot.draw(this.ctx, this.tileSize, this.offsetX, this.offsetY);

        this.particlePool.draw(this.ctx, this.offsetX, this.offsetY);

        this.ctx.restore();
    }
}
