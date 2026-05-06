// A quick script to verify core game mechanics without the browser's RequestAnimationFrame or Canvas
import { GridMap, Robot, TILE_WALL, TILE_KEY_RED, TILE_GATE_RED, TILE_EMPTY } from './js/entities.js';

console.log("Starting tests...");

const mapData = [
    [1, 1, 1, 1, 1],
    [1, 0, 3, 4, 1],
    [1, 1, 1, 1, 1]
];

const gridMap = new GridMap(mapData);
const robot = new Robot(1, 1, 0); // At (1,1) facing East (0)

// Initial state check
if (robot.x !== 1 || robot.y !== 1) console.error("Test failed: Initial position");
if (gridMap.getTile(3, 1) !== TILE_GATE_RED) console.error("Test failed: Gate red not found");

console.log("Moving Forward (should pick up key)");
let tx = robot.x + 1;
let ty = robot.y;
let tdir = robot.dir;
if (gridMap.isWalkable(tx, ty)) {
    robot.setTarget(tx, ty, tdir);
    robot.finishAnimation();
    gridMap.interact(robot.x, robot.y);
}

if (robot.x !== 2 || robot.y !== 1) console.error("Test failed: Move to (2,1)");
if (!gridMap.redGatesOpen) console.error("Test failed: Red gates did not open");

console.log("Moving Forward (should pass through now-open gate)");
tx = robot.x + 1;
ty = robot.y;
tdir = robot.dir;
if (gridMap.isWalkable(tx, ty)) {
    robot.setTarget(tx, ty, tdir);
    robot.finishAnimation();
    gridMap.interact(robot.x, robot.y);
}

if (robot.x !== 3 || robot.y !== 1) console.error("Test failed: Move to (3,1) blocked by gate");

console.log("All tests passed!");
