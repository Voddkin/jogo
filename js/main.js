import { GridMap, Robot, TILE_EMPTY, TILE_WALL, TILE_ROLLER_RIGHT, TILE_KEY_RED, TILE_GATE_RED, TILE_LASER, TILE_BUTTON, TILE_SIZE } from './entities.js';

class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // 0=Empty, 1=Wall, 2=Roller(R), 3=Key(Red), 4=Gate(Red), 5=Laser, 6=Button
        const testMapData = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 4, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 3, 0, 0, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 6, 0, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ];

        this.gridMap = new GridMap(testMapData);
        this.robot = new Robot(1, 1, 0); // Start at (1,1) facing East(0)

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

        this.updateQueueDisplay();
        requestAnimationFrame(this.gameLoop.bind(this));
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
        document.getElementById('queue-display').innerText = this.commandQueue.join(' -> ') || 'Queue is empty';
    }

    resetLevel() {
        if (this.isExecuting) {
            this.isExecuting = false;
        }
        this.gridMap.reset();
        this.robot.reset();
        this.clearQueue();
    }

    executeQueue() {
        if (this.isExecuting || this.commandQueue.length === 0) return;
        this.isExecuting = true;
        this.timeSinceLastCommand = 0;
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

        if (cmd === 'MOVE_FORWARD') {
            const nx = tx + dx[tdir];
            const ny = ty + dy[tdir];
            if (this.gridMap.isWalkable(nx, ny)) {
                tx = nx;
                ty = ny;
            }
        } else if (cmd === 'MOVE_BACKWARD') {
            const nx = tx - dx[tdir];
            const ny = ty - dy[tdir];
            if (this.gridMap.isWalkable(nx, ny)) {
                tx = nx;
                ty = ny;
            }
        } else if (cmd === 'TURN_RIGHT') {
            tdir = (tdir + 1) % 4;
        } else if (cmd === 'TURN_LEFT') {
            tdir = (tdir + 3) % 4;
        } else if (cmd === 'ACTIVATE_EMP') {
            this.robot.empActive = !this.robot.empActive;
            this.updateMapInteractions(tx, ty); // Check button toggle
        }

        this.robot.setTarget(tx, ty, tdir);

        // After setting target, if moved, check for interactions
        if (tx !== this.robot.x || ty !== this.robot.y) {
            this.gridMap.interact(tx, ty);
        }

        // Handle Roller
        if (cmd === 'ROLLER_MOVE_RIGHT') {
            if (this.gridMap.isWalkable(tx + 1, ty)) {
                 tx = tx + 1;
                 this.robot.setTarget(tx, ty, tdir);
                 this.gridMap.interact(tx, ty);
                 if (this.gridMap.getTile(tx, ty) === TILE_ROLLER_RIGHT) {
                     this.commandQueue.unshift('ROLLER_MOVE_RIGHT');
                 }
            }
        } else if (this.gridMap.getTile(tx, ty) === TILE_ROLLER_RIGHT) {
            // Queue an automatic move right
            this.commandQueue.unshift('ROLLER_MOVE_RIGHT');
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
        if (this.robot.isAnimating) {
            this.robot.updateAnimation();
            if (!this.robot.isAnimating) {
                this.robot.finishAnimation();
                this.timeSinceLastCommand = 0; // start delay timer after animation finishes
            }
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
        this.robot.draw(this.ctx);
    }
}

// Start game when loaded
window.onload = () => {
    window.game = new Game('gameCanvas');
};
