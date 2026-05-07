import { Game } from './game.js';

let game;

window.onload = () => {
    game = new Game('gameCanvas');

    // Bind UI commands globally for inline onclick handlers in index.html
    window.addCommand = (cmd) => game.addCommand(cmd);
    window.executeQueue = () => game.executeQueue();
    window.clearQueue = () => game.clearQueue();
    window.resetLevel = () => game.resetLevel();

    // Bind next level button
    document.getElementById('btn-next-level').addEventListener('click', () => {
        game.loadLevel(game.currentLevelIndex + 1);
    });
};
