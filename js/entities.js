export const TILE_SIZE = 50;

// Tile types
export const TILE_EMPTY = 0;
export const TILE_WALL = 1;
export const TILE_ROLLER_RIGHT = 2;
export const TILE_KEY_RED = 3;
export const TILE_GATE_RED = 4;
export const TILE_LASER = 5;
export const TILE_BUTTON = 6;
export const TILE_EXIT = 7;

export class GridMap {
    constructor(levelData) {
        this.cols = levelData.width;
        this.rows = levelData.height;
        this.initialGridData = this.parseLayout(levelData.layout);
        this.grid = JSON.parse(JSON.stringify(this.initialGridData));
        this.redGatesOpen = false;
        this.buttonPressed = false;
    }

    parseLayout(layout) {
        const parsedMap = [];
        for (let y = 0; y < layout.length; y++) {
            const row = [];
            for (let x = 0; x < layout[y].length; x++) {
                const char = layout[y][x];
                switch(char) {
                    case 'W': row.push(TILE_WALL); break;
                    case '.': row.push(TILE_EMPTY); break;
                    case 'R>': row.push(TILE_ROLLER_RIGHT); break;
                    case 'K_R': row.push(TILE_KEY_RED); break;
                    case 'G_R': row.push(TILE_GATE_RED); break;
                    case 'L': row.push(TILE_LASER); break;
                    case 'B': row.push(TILE_BUTTON); break;
                    case 'E': row.push(TILE_EXIT); break;
                    default: row.push(TILE_EMPTY); break;
                }
            }
            parsedMap.push(row);
        }
        return parsedMap;
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
        if (tile === TILE_WALL) return false;
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

    draw(ctx) {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const tile = this.getTile(x, y);
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;

                // Draw base floor
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#444';
                ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

                if (tile === TILE_WALL) {
                    ctx.fillStyle = '#666';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                } else if (tile === TILE_ROLLER_RIGHT) {
                    ctx.fillStyle = '#3a3a5a';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#88f';
                    ctx.beginPath();
                    ctx.moveTo(px + 10, py + 10);
                    ctx.lineTo(px + 40, py + 25);
                    ctx.lineTo(px + 10, py + 40);
                    ctx.fill();
                } else if (tile === TILE_KEY_RED) {
                    ctx.fillStyle = '#ffcc00';
                    ctx.beginPath();
                    ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 10, 0, Math.PI * 2);
                    ctx.fill();
                } else if (tile === TILE_GATE_RED) {
                    ctx.fillStyle = this.redGatesOpen ? '#442222' : '#ff4444';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    if (!this.redGatesOpen) {
                        ctx.strokeStyle = '#aa0000';
                        ctx.lineWidth = 4;
                        ctx.strokeRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                        ctx.lineWidth = 1;
                    }
                } else if (tile === TILE_LASER) {
                    if (!this.buttonPressed) {
                        ctx.fillStyle = '#ff00ff';
                        ctx.fillRect(px + TILE_SIZE / 2 - 2, py, 4, TILE_SIZE);
                    }
                } else if (tile === TILE_BUTTON) {
                    ctx.fillStyle = this.buttonPressed ? '#55ff55' : '#115511';
                    ctx.beginPath();
                    ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 15, 0, Math.PI * 2);
                    ctx.fill();
                } else if (tile === TILE_EXIT) {
                    ctx.fillStyle = '#00ff00';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#005500';
                    ctx.font = '20px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('EXIT', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
                }
            }
        }
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
        this.animSpeed = 0.1; // 1.0 = instant, 0.1 = 10 frames

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

    updateAnimation() {
        if (!this.isAnimating) return;

        this.animProgress += this.animSpeed;
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

    draw(ctx) {
        const px = this.visualX * TILE_SIZE + TILE_SIZE / 2;
        const py = this.visualY * TILE_SIZE + TILE_SIZE / 2;
        const rotation = this.visualDir * Math.PI / 2;

        if (this.empActive) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(px, py, TILE_SIZE * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(rotation);

        // Robot body
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(-TILE_SIZE * 0.4, -TILE_SIZE * 0.4, TILE_SIZE * 0.8, TILE_SIZE * 0.8);

        // Direction indicator (front)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(TILE_SIZE * 0.2, -TILE_SIZE * 0.1, TILE_SIZE * 0.2, TILE_SIZE * 0.2);

        ctx.restore();
    }
}
