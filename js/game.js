import { GridMap, Robot, PushableBox, TILE_BUTTON, TILE_EXIT, TILE_WARP_A, TILE_WARP_B, TILE_ICE, TILE_ROLLER_RIGHT, TILE_ROLLER_LEFT, TILE_ROLLER_UP, TILE_ROLLER_DOWN, TILE_FRAGILE, TILE_HOLE, TILE_ABYSS } from './entities.js';
import { LEVEL_DATABASE } from './levels.js';
import { LevelParser } from './levelParser.js';
import { UIManager } from './uiManager.js';
import { Camera } from './camera.js';
import { ParticlePool } from './particles.js';

const GAME_STATES = Object.freeze({
    IDLE: 'IDLE',
    EXECUTING: 'EXECUTING',
    ANIMATING: 'ANIMATING',
    FORCED_SLIDE: 'FORCED_SLIDE',
    WARPING_IN: 'WARPING_IN',
    WARPING_OUT: 'WARPING_OUT',
    ROLLER_DELAY: 'ROLLER_DELAY',
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

        this.chainReactionCount = 0; // For deadlock prevention

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
        this.dynamicEntities = [];
        this.dynamicEntities.push(this.robot);
        parsedData.initialBoxes.forEach(pos => {
            this.dynamicEntities.push(new PushableBox(pos.x, pos.y));
        });

        // Logical Circuit State
        this.triggers = parsedData.triggers;
        this.receivers = parsedData.receivers;

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

        // Deep reset
        this.loadLevel(this.currentLevelIndex);
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
        this.chainReactionCount = 0;

        this.state = GAME_STATES.EXECUTING;
        this.uiManager.updateStateStatus(this.state);
        this.uiManager.highlightExecutingBlock(this.uiExecIndex);
    }

    getBoxAt(x, y) {
        return this.dynamicEntities.find(ent => ent !== this.robot && ent.x === x && ent.y === y);
    }

    processLogicalCommand() {
        if (this.executionQueue.length === 0) {
            this.state = GAME_STATES.IDLE;
            return;
        }

        let cmd = this.executionQueue.shift();

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

        let moveType = 'IDLE';

        const tryMove = (nx, ny, dirX, dirY) => {
            const box = this.getBoxAt(nx, ny);
            if (box) {
                const nnx = nx + dirX;
                const nny = ny + dirY;
                if (this.gridMap.isWalkable(nnx, nny) && !this.getBoxAt(nnx, nny)) {
                    box.setTarget(nnx, nny, 'PUSH');
                    moveType = 'PUSH';
                    this.camera.addTrauma(0.1);
                    return true;
                }
                return false;
            } else if (this.gridMap.isWalkable(nx, ny)) {
                moveType = 'MOVE';
                return true;
            }
            return false;
        };

        if (cmd === 'MOVE_FORWARD' || cmd === 'SYS_SLIDE_FORWARD') {
            const nx = tx + dx[tdir];
            const ny = ty + dy[tdir];
            if (tryMove(nx, ny, dx[tdir], dy[tdir])) {
                tx = nx;
                ty = ny;
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
            if (tryMove(tx + 1, ty, 1, 0)) { tx += 1; }
        } else if (cmd === 'SYS_FORCE_S') {
            if (tryMove(tx, ty + 1, 0, 1)) { ty += 1; }
        } else if (cmd === 'SYS_FORCE_W') {
            if (tryMove(tx - 1, ty, -1, 0)) { tx -= 1; }
        } else if (cmd === 'SYS_FORCE_N') {
            if (tryMove(tx, ty - 1, 0, -1)) { ty -= 1; }
        } else if (cmd === 'TURN_RIGHT') {
            tdir = (tdir + 1) % 4;
            moveType = 'TURN';
            // Spawn turn particles
            for (let i = 0; i < 4; i++) {
                const angle = (this.robot.visualDir + 2) * Math.PI / 2 + (Math.random() * 0.5 - 0.25);
                this.particlePool.spawn(
                    this.robot.visualX * this.tileSize + this.tileSize / 2,
                    this.robot.visualY * this.tileSize + this.tileSize / 2,
                    Math.cos(angle) * 0.1, Math.sin(angle) * 0.1,
                    Math.random() * 2 + 1, '#ffffff', 200
                );
            }
        } else if (cmd === 'TURN_LEFT') {
            tdir = (tdir + 3) % 4;
            moveType = 'TURN';
            // Spawn turn particles
            for (let i = 0; i < 4; i++) {
                const angle = (this.robot.visualDir + 2) * Math.PI / 2 + (Math.random() * 0.5 - 0.25);
                this.particlePool.spawn(
                    this.robot.visualX * this.tileSize + this.tileSize / 2,
                    this.robot.visualY * this.tileSize + this.tileSize / 2,
                    Math.cos(angle) * 0.1, Math.sin(angle) * 0.1,
                    Math.random() * 2 + 1, '#ffffff', 200
                );
            }
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
            // Add concentric rings with delays
            for (let i = 0; i < 3; i++) {
                this.empRings.push({
                    x: this.robot.visualX * this.tileSize + this.tileSize / 2,
                    y: this.robot.visualY * this.tileSize + this.tileSize / 2,
                    radius: this.tileSize * 0.5,
                    maxRadius: this.tileSize * 3,
                    thickness: 6 - (i * 1.5),
                    life: 400 + (i * 100), // Delay via extended maxLife
                    maxLife: 400 + (i * 100)
                });
            }

            this.updateMapInteractions(tx, ty);
        }

        const moved = (tx !== this.robot.x || ty !== this.robot.y) && moveType !== 'BUMP';

        if (moved && currentTileType === TILE_FRAGILE) {
            this.gridMap.setTile(this.robot.x, this.robot.y, TILE_ABYSS); // Ultra Prompt 6: ABYSS instead of HOLE
            // Spawn 8 polygonal breaking particles
            for (let i = 0; i < 8; i++) {
                const vx = Math.random() * 0.4 - 0.2;
                const vy = Math.random() * 0.4 - 0.2; // They will fall via Y visually over time or just expand
                this.particlePool.spawn(
                    this.robot.x * this.tileSize + this.tileSize / 2,
                    this.robot.y * this.tileSize + this.tileSize / 2,
                    vx, vy, Math.random() * 4 + 2, '#ff3366', 500
                );
            }
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

        this.updateMapInteractions(tx, ty);
        this.state = GAME_STATES.ANIMATING;
    }

    evaluateLanding() {
        if (this.state === GAME_STATES.FAILED || this.state === GAME_STATES.LEVEL_COMPLETE) return;

        // Check if we left a fragile tile, if so, break it into abyss
        const previousTile = this.gridMap.getTile(this.robot.x, this.robot.y);
        // Because robot x,y are already updated to the new tile when ANIMATING finishes,
        // we can't check the previous tile using robot coordinates directly here if we want to mutate what we just left.
        // Wait, the robot.x/y ARE the target coordinates now. We need to find if there's any fragile tile left behind.
        // Let's just scan for FRAGILE tiles that have no robot or box on them and mutate them.
        // A better approach is to rely on `processLogicalCommand` setting the target tile to HOLE before ANIMATING.
        // The original code did: `if (moved && currentTileType === TILE_FRAGILE) { setTile(HOLE) }`
        // We will keep that logic there, but change TILE_HOLE to TILE_ABYSS, and spawn particles here.
        // Actually, the prompt says: "When FSM registers the robot left the coordinates... mutate to TILE_ABYSS".
        // The mutation was already in `processLogicalCommand`. I'll update it to spawn particles there.

        this.chainReactionCount++;
        if (this.chainReactionCount > 50) {
            this.state = GAME_STATES.FAILED;
            this.uiManager.updateStateStatus(this.state);
            this.camera.addTrauma(1.0);
            const overlay = document.getElementById('overlay-message');
            overlay.classList.remove('hidden');
            document.getElementById('overlay-text').innerText = "STACK OVERFLOW";
            return;
        }

        const tx = this.robot.x;
        const ty = this.robot.y;
        const tdir = this.robot.dir;

        const finalTileType = this.gridMap.getTile(tx, ty);

        // Warp handling
        if (finalTileType === TILE_WARP_A || finalTileType === TILE_WARP_B) {
            const destType = finalTileType === TILE_WARP_A ? TILE_WARP_B : TILE_WARP_A;
            const dest = this.gridMap.findTile(destType);
            if (dest) {
                this.state = GAME_STATES.WARPING_IN;
                this.warpDest = dest;
                return;
            }
        }

        // Roller handling
        if (finalTileType === TILE_ROLLER_RIGHT) {
            if (this.gridMap.isWalkable(tx + 1, ty)) this.executionQueue.unshift('SYS_FORCE_E');
            this.state = GAME_STATES.ROLLER_DELAY;
            this.rollerTimer = 150;
            return;
        } else if (finalTileType === TILE_ROLLER_DOWN) {
            if (this.gridMap.isWalkable(tx, ty + 1)) this.executionQueue.unshift('SYS_FORCE_S');
            this.state = GAME_STATES.ROLLER_DELAY;
            this.rollerTimer = 150;
            return;
        } else if (finalTileType === TILE_ROLLER_LEFT) {
            if (this.gridMap.isWalkable(tx - 1, ty)) this.executionQueue.unshift('SYS_FORCE_W');
            this.state = GAME_STATES.ROLLER_DELAY;
            this.rollerTimer = 150;
            return;
        } else if (finalTileType === TILE_ROLLER_UP) {
            if (this.gridMap.isWalkable(tx, ty - 1)) this.executionQueue.unshift('SYS_FORCE_N');
            this.state = GAME_STATES.ROLLER_DELAY;
            this.rollerTimer = 150;
            return;
        }

        // Ice handling
        if (finalTileType === TILE_ICE) {
            const dx = [1, 0, -1, 0];
            const dy = [0, 1, 0, -1];
            if (this.gridMap.isWalkable(tx + dx[tdir], ty + dy[tdir])) {
                this.executionQueue.unshift('SYS_SLIDE_FORWARD');
                this.state = GAME_STATES.FORCED_SLIDE;
                return;
            }
        }

        // Evaluate dynamic entities (Boxes) physics
        let boxPhysicsTriggered = false;

        for (let i = this.dynamicEntities.length - 1; i >= 0; i--) {
            const ent = this.dynamicEntities[i];
            if (ent === this.robot) continue;

            const ex = ent.x;
            const ey = ent.y;
            const tile = this.gridMap.getTile(ex, ey);

            if (tile === TILE_ABYSS && ent.physicsState !== 'FALLING') {
                // Box falls into abyss
                ent.physicsState = 'FALLING';
                ent.setTarget(ex, ey, 'IDLE'); // Just trigger animation for falling

                // Spawn dust particles
                this.camera.addTrauma(0.5);
                for (let p = 0; p < 20; p++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 0.3;
                    this.particlePool.spawn(
                        ex * this.tileSize + this.tileSize / 2,
                        ey * this.tileSize + this.tileSize / 2,
                        Math.cos(angle) * speed, Math.sin(angle) * speed - 0.2, // Move slightly up
                        Math.random() * 4 + 2, '#887766', 600
                    );
                }

                // Mutate the abyss back to empty ground
                this.gridMap.setTile(ex, ey, TILE_EMPTY);

                boxPhysicsTriggered = true;
            } else if (tile === TILE_ICE && ent.physicsState !== 'FALLING') {
                const dirX = ent.lastDx;
                const dirY = ent.lastDy;
                if ((dirX !== 0 || dirY !== 0) && this.gridMap.isWalkable(ex + dirX, ey + dirY) && !this.getBoxAt(ex + dirX, ey + dirY) && (this.robot.x !== ex + dirX || this.robot.y !== ey + dirY)) {
                    ent.physicsState = 'FORCED_SLIDE';
                    ent.setTarget(ex + dirX, ey + dirY, 'MOVE');
                    boxPhysicsTriggered = true;
                } else {
                    ent.physicsState = 'IDLE';
                }
            } else if (tile === TILE_ROLLER_RIGHT) {
                if (this.gridMap.isWalkable(ex + 1, ey) && !this.getBoxAt(ex + 1, ey) && (this.robot.x !== ex + 1 || this.robot.y !== ey)) {
                    ent.setTarget(ex + 1, ey, 'MOVE');
                    boxPhysicsTriggered = true;
                }
            } else if (tile === TILE_ROLLER_LEFT) {
                if (this.gridMap.isWalkable(ex - 1, ey) && !this.getBoxAt(ex - 1, ey) && (this.robot.x !== ex - 1 || this.robot.y !== ey)) {
                    ent.setTarget(ex - 1, ey, 'MOVE');
                    boxPhysicsTriggered = true;
                }
            } else if (tile === TILE_ROLLER_UP) {
                if (this.gridMap.isWalkable(ex, ey - 1) && !this.getBoxAt(ex, ey - 1) && (this.robot.x !== ex || this.robot.y !== ey - 1)) {
                    ent.setTarget(ex, ey - 1, 'MOVE');
                    boxPhysicsTriggered = true;
                }
            } else if (tile === TILE_ROLLER_DOWN) {
                if (this.gridMap.isWalkable(ex, ey + 1) && !this.getBoxAt(ex, ey + 1) && (this.robot.x !== ex || this.robot.y !== ey + 1)) {
                    ent.setTarget(ex, ey + 1, 'MOVE');
                    boxPhysicsTriggered = true;
                }
            }
        }

        if (boxPhysicsTriggered) {
            this.state = GAME_STATES.ANIMATING;
            return;
        }

        // Evaluate circuits after all landings to sync lasers
        this.evaluateCircuits();

        // No more forced moves, resume execution
        if (this.executionQueue.length === 0) {
            this.state = GAME_STATES.IDLE;
            this.uiManager.updateStateStatus(this.state);
        } else {
            this.state = GAME_STATES.EXECUTING;
        }
    }

    updateMapInteractions(x, y) {
        this.evaluateCircuits();
    }

    evaluateCircuits() {
        if (!this.triggers || !this.receivers) return;

        // Reset all triggers
        for (const trig of this.triggers) {
            trig.active = false;
        }

        // Evaluate triggers
        for (const ent of this.dynamicEntities) {
            const ex = ent.targetX;
            const ey = ent.targetY;

            for (const trig of this.triggers) {
                if (trig.x === ex && trig.y === ey) {
                    trig.active = true;
                }
            }
        }

        // EMP overrides triggers
        if (this.robot.empActive) {
            for (const trig of this.triggers) {
                if (Math.abs(trig.x - this.robot.targetX) <= 1 && Math.abs(trig.y - this.robot.targetY) <= 1) {
                    trig.active = true;
                }
            }
        }

        // Particle feedback on freshly pressed buttons
        for (const trig of this.triggers) {
            if (trig.active && !trig.wasActive) {
                for (let i = 0; i < 15; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 0.15 + 0.05;
                    this.particlePool.spawn(
                        trig.x * this.tileSize + this.tileSize / 2,
                        trig.y * this.tileSize + this.tileSize / 2,
                        Math.cos(angle) * speed, Math.sin(angle) * speed,
                        Math.random() * 2 + 1, '#00ffaa', 300
                    );
                }
            }
            trig.wasActive = trig.active;

            // Sync legacy button state for generic map features
            if (this.gridMap.getTile(trig.x, trig.y) === TILE_BUTTON) {
                this.gridMap.buttonPressed = this.gridMap.buttonPressed || trig.active;
            }
        }

        // Evaluate receivers (Lasers)
        for (const rec of this.receivers) {
            if (rec.type === 'laser') {
                let conditionMet = false;
                if (rec.logic === 'AND') {
                    conditionMet = true;
                    for (const reqId of rec.requires) {
                        const t = this.triggers.find(tr => tr.id === reqId);
                        if (!t || !t.active) conditionMet = false;
                    }
                } else if (rec.logic === 'OR') {
                    conditionMet = false;
                    for (const reqId of rec.requires) {
                        const t = this.triggers.find(tr => tr.id === reqId);
                        if (t && t.active) conditionMet = true;
                    }
                }
                rec.active = conditionMet;
            }
        }

        // Sync legacy map for backwards compatibility if needed
        this.gridMap.receiversState = this.receivers;
        this.gridMap.triggersState = this.triggers;
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

        // Remove completely fallen boxes
        for (let i = this.dynamicEntities.length - 1; i >= 0; i--) {
            const ent = this.dynamicEntities[i];
            if (ent.physicsState === 'FALLING' && !ent.isAnimating && ent.scaleX === 0) {
                this.dynamicEntities.splice(i, 1);
            }
        }

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

                for (const ent of this.dynamicEntities) {
                    if (ent.isAnimating || ent.moveType !== 'IDLE' || ent.physicsState !== 'IDLE') {
                        ent.updateAnimation(dt);
                        isAnyAnimating = isAnyAnimating || ent.isAnimating;
                        if (!ent.isAnimating && ent.moveType !== 'IDLE') {
                            ent.finishAnimation();
                        }
                    }
                }

                if (!isAnyAnimating) {
                    this.evaluateLanding();
                }
                break;

            case GAME_STATES.FORCED_SLIDE:
                this.processLogicalCommand();
                break;

            case GAME_STATES.WARPING_IN:
                // Squashing animation Z-axis (scale to 0)
                this.robot.scaleX = Math.max(0, this.robot.scaleX - dt * 0.005);
                this.robot.scaleY = Math.max(0, this.robot.scaleY - dt * 0.005);
                if (this.robot.scaleX === 0) {
                    this.robot.visualX = this.warpDest.x;
                    this.robot.visualY = this.warpDest.y;
                    this.robot.x = this.warpDest.x;
                    this.robot.y = this.warpDest.y;

                    this.camera.addTrauma(0.4);
                    // Flash effect could be done here or in Renderer

                    this.state = GAME_STATES.WARPING_OUT;
                }
                break;

            case GAME_STATES.WARPING_OUT:
                // Elastic scale up
                this.robot.scaleX = Math.min(1.0, this.robot.scaleX + dt * 0.008);
                this.robot.scaleY = Math.min(1.0, this.robot.scaleY + dt * 0.008);
                if (this.robot.scaleX >= 1.0) {
                    this.robot.scaleX = 1.0;
                    this.robot.scaleY = 1.0;
                    this.evaluateLanding();
                }
                break;

            case GAME_STATES.ROLLER_DELAY:
                this.rollerTimer -= dt;
                if (this.rollerTimer <= 0) {
                    this.state = GAME_STATES.EXECUTING;
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

        const time = Date.now();
        this.gridMap.drawFloor(this.ctx, this.tileSize, this.offsetX, this.offsetY, time);

        // Logic Circuit Wires
        if (this.receivers && this.triggers) {
            for (const rec of this.receivers) {
                for (const reqId of rec.requires) {
                    const trig = this.triggers.find(t => t.id === reqId);
                    if (trig) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.offsetX + trig.x * this.tileSize + this.tileSize / 2, this.offsetY + trig.y * this.tileSize + this.tileSize / 2);
                        this.ctx.lineTo(this.offsetX + rec.x * this.tileSize + this.tileSize / 2, this.offsetY + rec.y * this.tileSize + this.tileSize / 2);

                        if (trig.active) {
                            this.ctx.strokeStyle = '#00ffcc';
                            this.ctx.lineWidth = 2;
                            this.ctx.shadowColor = '#00ffcc';
                            this.ctx.shadowBlur = 10;
                        } else {
                            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                            this.ctx.lineWidth = 1;
                            this.ctx.shadowBlur = 0;
                        }
                        this.ctx.stroke();
                        this.ctx.shadowBlur = 0;
                    }
                }
            }
        }

        // EMP Rings, Ribbon Trail will go here...
        this.robot.drawTrail(this.ctx, this.tileSize, this.offsetX, this.offsetY);

        // Draw EMP rings (Ultra Prompt 5)
        for (const ring of this.empRings) {
            this.ctx.save();
            const alpha = ring.life / ring.maxLife;
            this.ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            this.ctx.lineWidth = ring.thickness;
            this.ctx.setLineDash([10, 20, 5, 10]);
            this.ctx.lineDashOffset = time * 0.05; // Spinning dashed line
            this.ctx.beginPath();
            this.ctx.arc(this.offsetX + ring.x, this.offsetY + ring.y, ring.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore(); // MUST restore to clear setLineDash

            // Central Flash
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'screen';
            const flashGrad = this.ctx.createRadialGradient(
                this.offsetX + ring.x, this.offsetY + ring.y, 0,
                this.offsetX + ring.x, this.offsetY + ring.y, ring.radius
            );
            flashGrad.addColorStop(0, `rgba(0, 255, 255, ${alpha * 0.2})`);
            flashGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');
            this.ctx.fillStyle = flashGrad;
            this.ctx.beginPath();
            this.ctx.arc(this.offsetX + ring.x, this.offsetY + ring.y, ring.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        this.gridMap.drawWalls(this.ctx, this.tileSize, this.offsetX, this.offsetY);

        // Y-Sort dynamic entities before drawing
        this.dynamicEntities.sort((a, b) => {
            return a.visualY !== b.visualY ? a.visualY - b.visualY : a.visualX - b.visualX;
        });

        for (const ent of this.dynamicEntities) {
            ent.draw(this.ctx, this.tileSize, this.offsetX, this.offsetY);
        }

        this.particlePool.draw(this.ctx, this.offsetX, this.offsetY);

        this.ctx.restore();
    }
}
