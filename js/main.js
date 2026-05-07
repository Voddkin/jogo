import { GridMap, Robot, PushableBox, TILE_EMPTY, TILE_WALL, TILE_ROLLER_RIGHT, TILE_ROLLER_LEFT, TILE_ROLLER_UP, TILE_ROLLER_DOWN, TILE_KEY_RED, TILE_GATE_RED, TILE_LASER, TILE_BUTTON, TILE_EXIT, TILE_ICE, TILE_WARP_A, TILE_WARP_B, TILE_FRAGILE, TILE_HOLE, TILE_SIZE } from './entities.js';
import { LEVELS } from './levels.js';

class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.currentLevelIndex = 0;

        this.commandQueue = [];
        this.isExecuting = false;
        this.lastTime = 0;

        // Command delay configuration
        this.commandDelay = 500; // ms
        this.timeSinceLastCommand = 0;

        // Bind global UI functions
        window.addCommand = this.addCommand.bind(this);
        window.executeQueue = this.executeQueue.bind(this);
        window.clearQueue = this.clearQueue.bind(this);
        window.resetLevel = this.resetLevel.bind(this);

        this.loadLevel(this.currentLevelIndex);
        this.updateQueueDisplay();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    loadLevel(index) {
        if (index >= LEVELS.length) {
            alert("Congratulations! You have completed all levels.");
            return;
        }

        this.currentLevelIndex = index;
        const levelData = LEVELS[index];

        document.getElementById('level-name').innerText = levelData.name;

        this.gridMap = new GridMap(levelData);
        this.robot = new Robot(levelData.robotStart.x, levelData.robotStart.y, levelData.robotStart.dir);
        this.boxes = this.gridMap.initialBoxes.map(pos => new PushableBox(pos.x, pos.y));

        this.clearQueue();
        this.isExecuting = false;
        this.updateMapInteractions(this.robot.x, this.robot.y);
    }

    addCommand(cmd) {
        if (this.isExecuting) return;
        this.commandQueue.push(cmd);
        this.updateQueueDisplay();
    }

    clearQueue() {
        if (this.isExecuting) return;
        this.commandQueue = [];
        this.updateQueueDisplay();
    }

    updateQueueDisplay() {
        // Filter out internal movement commands so the user doesn't see "SLIDE" or "FORCE_MOVE"
        const displayQueue = this.commandQueue.filter(cmd => !cmd.startsWith('SYS_'));
        document.getElementById('queue-display').innerText = displayQueue.join(' -> ') || 'Queue is empty';
    }

    resetLevel() {
        if (this.isExecuting) {
            this.isExecuting = false;
        }
        this.gridMap.reset();
        this.robot.reset();
        this.boxes.forEach(box => box.reset());
        this.clearQueue();
        this.updateMapInteractions(this.robot.x, this.robot.y);
    }

    executeQueue() {
        if (this.isExecuting || this.commandQueue.length === 0) return;
        this.isExecuting = true;
        this.timeSinceLastCommand = 0;
    }

    getBoxAt(x, y) {
        return this.boxes.find(box => box.x === x && box.y === y);
    }

    processNextCommand() {
        if (this.commandQueue.length === 0) {
            this.isExecuting = false;
            return;
        }

        const cmd = this.commandQueue.shift();
        this.updateQueueDisplay();

        let tx = this.robot.x;
        let ty = this.robot.y;
        let tdir = this.robot.dir;

        // Directions: 0=E(1,0), 1=S(0,1), 2=W(-1,0), 3=N(0,-1)
        const dx = [1, 0, -1, 0];
        const dy = [0, 1, 0, -1];

        // Fragile Floor handling: if robot moves off a fragile tile, collapse it
        const currentTileType = this.gridMap.getTile(tx, ty);

        const tryMove = (nx, ny, dirX, dirY) => {
            const box = this.getBoxAt(nx, ny);
            if (box) {
                // If there's a box, check if we can push it
                const nnx = nx + dirX;
                const nny = ny + dirY;
                if (this.gridMap.isWalkable(nnx, nny) && !this.getBoxAt(nnx, nny)) {
                    // Push box
                    box.setTarget(nnx, nny);
                    return true;
                }
                return false; // Can't push box
            } else if (this.gridMap.isWalkable(nx, ny)) {
                return true; // No box, walkable
            }
            return false; // Not walkable
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
            this.updateMapInteractions(tx, ty); // Check button toggle
        }

        const moved = (tx !== this.robot.x || ty !== this.robot.y);

        // Collapse fragile tile if we moved off it
        if (moved && currentTileType === TILE_FRAGILE) {
            this.gridMap.setTile(this.robot.x, this.robot.y, TILE_HOLE);
        }

        this.robot.setTarget(tx, ty, tdir);

        // After setting target, if moved, check for interactions
        if (moved) {
            this.gridMap.interact(tx, ty);
        }

        // Check new tile state
        const newTileType = this.gridMap.getTile(tx, ty);

        // Handle Level Exit
        if (cmd === 'NEXT_LEVEL') {
            this.loadLevel(this.currentLevelIndex + 1);
            return;
        } else if (newTileType === TILE_EXIT && !this.commandQueue.includes('NEXT_LEVEL')) {
            // Queue up a level transition and clear the rest
            this.commandQueue = ['NEXT_LEVEL'];
        }

        // Handle Warp (Teleporters)
        if (newTileType === TILE_WARP_A && moved) {
            const warpB = this.gridMap.findTile(TILE_WARP_B);
            if (warpB) {
                // Instant teleport setup
                this.robot.visualX = warpB.x;
                this.robot.visualY = warpB.y;
                this.robot.x = warpB.x;
                this.robot.y = warpB.y;
                tx = warpB.x;
                ty = warpB.y;
                this.robot.setTarget(tx, ty, tdir);
                // force visual immediate jump
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

        // Evaluate next environment forces
        const finalTileType = this.gridMap.getTile(tx, ty);

        // Ice logic
        if (finalTileType === TILE_ICE) {
            // If we just moved forward or are sliding forward, continue sliding forward
            if (cmd === 'MOVE_FORWARD' || cmd === 'SYS_SLIDE_FORWARD') {
                if (this.gridMap.isWalkable(tx + dx[tdir], ty + dy[tdir])) {
                    this.commandQueue.unshift('SYS_SLIDE_FORWARD');
                }
            } else if (cmd === 'MOVE_BACKWARD' || cmd === 'SYS_SLIDE_BACKWARD') {
                if (this.gridMap.isWalkable(tx - dx[tdir], ty - dy[tdir])) {
                    this.commandQueue.unshift('SYS_SLIDE_BACKWARD');
                }
            }
        }

        // Roller logic
        if (finalTileType === TILE_ROLLER_RIGHT) {
            if (this.gridMap.isWalkable(tx + 1, ty)) this.commandQueue.unshift('SYS_FORCE_E');
        } else if (finalTileType === TILE_ROLLER_DOWN) {
            if (this.gridMap.isWalkable(tx, ty + 1)) this.commandQueue.unshift('SYS_FORCE_S');
        } else if (finalTileType === TILE_ROLLER_LEFT) {
            if (this.gridMap.isWalkable(tx - 1, ty)) this.commandQueue.unshift('SYS_FORCE_W');
        } else if (finalTileType === TILE_ROLLER_UP) {
            if (this.gridMap.isWalkable(tx, ty - 1)) this.commandQueue.unshift('SYS_FORCE_N');
        }

        this.updateMapInteractions(tx, ty);
    }

    updateMapInteractions(x, y) {
        // Simple EMP logic: checks 3x3 area for a button
        let buttonPressed = false;

        // Robot standing on button
        if (this.gridMap.getTile(x, y) === TILE_BUTTON) {
            buttonPressed = true;
        }

        // Check if any box is on a button
        for (const box of this.boxes) {
            if (this.gridMap.getTile(box.targetX, box.targetY) === TILE_BUTTON) {
                buttonPressed = true;
            }
        }

        // EMP active checking 3x3 area
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
        let isAnyAnimating = false;

        if (this.robot.isAnimating) {
            this.robot.updateAnimation();
            isAnyAnimating = true;
            if (!this.robot.isAnimating) {
                this.robot.finishAnimation();
            }
        }

        for (const box of this.boxes) {
            if (box.isAnimating) {
                box.updateAnimation();
                isAnyAnimating = true;
                if (!box.isAnimating) {
                    box.finishAnimation();
                }
            }
        }

        if (isAnyAnimating) {
             // Reset timer while animating
             this.timeSinceLastCommand = 0;
        } else if (this.isExecuting) {
            this.timeSinceLastCommand += dt;
            if (this.timeSinceLastCommand >= this.commandDelay) {
                this.processNextCommand();
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.gridMap.draw(this.ctx);
        for (const box of this.boxes) {
            box.draw(this.ctx);
        }
        this.robot.draw(this.ctx);
    }
}

// Start game when loaded
window.onload = () => {
    window.game = new Game('gameCanvas');
};
