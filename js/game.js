import { GridMap, Robot, PushableBox, TILE_BUTTON, TILE_EXIT, TILE_WARP_A, TILE_WARP_B, TILE_ICE, TILE_ROLLER_RIGHT, TILE_ROLLER_LEFT, TILE_ROLLER_UP, TILE_ROLLER_DOWN, TILE_FRAGILE, TILE_HOLE } from './entities.js';
import { LEVEL_DATABASE } from './levels.js';
import { LevelParser } from './levelParser.js';
import { UIManager } from './uiManager.js';

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

        const cmd = this.executionQueue.shift();

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

        if (cmd === 'MOVE_FORWARD' || cmd === 'SYS_SLIDE_FORWARD') {
            const nx = tx + dx[tdir];
            const ny = ty + dy[tdir];
            if (tryMove(nx, ny, dx[tdir], dy[tdir])) {
                tx = nx;
                ty = ny;
            }
        } else if (cmd === 'MOVE_BACKWARD' || cmd === 'SYS_SLIDE_BACKWARD') {
            const nx = tx - dx[tdir];
            const ny = ty - dy[tdir];
            if (tryMove(nx, ny, -dx[tdir], -dy[tdir])) {
                tx = nx;
                ty = ny;
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
        } else if (cmd === 'TURN_LEFT') {
            tdir = (tdir + 3) % 4;
        } else if (cmd === 'ACTIVATE_EMP') {
            this.robot.empActive = !this.robot.empActive;
            this.updateMapInteractions(tx, ty);
        }

        const moved = (tx !== this.robot.x || ty !== this.robot.y);

        if (moved && currentTileType === TILE_FRAGILE) {
            this.gridMap.setTile(this.robot.x, this.robot.y, TILE_HOLE);
        }

        this.robot.setTarget(tx, ty, tdir);

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

        if (this.gridMap.getTile(x, y) === TILE_BUTTON) {
            buttonPressed = true;
        }

        for (const box of this.boxes) {
            if (this.gridMap.getTile(box.targetX, box.targetY) === TILE_BUTTON) {
                buttonPressed = true;
            }
        }

        if (this.robot.empActive) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (this.gridMap.getTile(x + dx, y + dy) === TILE_BUTTON) {
                        buttonPressed = true;
                    }
                }
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

        this.gridMap.draw(this.ctx, this.tileSize, this.offsetX, this.offsetY);
        for (const box of this.boxes) {
            box.draw(this.ctx, this.tileSize, this.offsetX, this.offsetY);
        }
        this.robot.draw(this.ctx, this.tileSize, this.offsetX, this.offsetY);
    }
}
