import { Game } from './game.js';
import { ScreenRouter } from './screenRouter.js';
import { AudioEngine } from './audioEngine.js';
import { LevelSelectUI } from './levelSelectUI.js';

let game;
let router;

// Mock Data Architecture for Progression
window.SystemData = {
    progress: {
        unlockedLevels: [1],
        completedLevels: [],
        linesOfCode: {}
    }
};

window.onload = () => {
    game = new Game('gameCanvas');
    router = new ScreenRouter(game);

    // Global bindings for inline HTML onclick handlers
    window.addCommand = (cmd) => game.addCommand(cmd);
    window.executeQueue = () => game.executeQueue();
    window.clearQueue = () => game.clearQueue();
    window.resetLevel = () => game.resetLevel();
    window.router = router;

    document.getElementById('btn-next-level').addEventListener('click', () => {
        game.loadLevel(game.currentLevelIndex + 1);
    });

    document.getElementById('btn-return-select').addEventListener('click', () => {
        LevelSelectUI.renderLevelGrid();
        router.maps('screen-level-select');
    });

    // AudioEngine hookups
    document.body.addEventListener('click', () => {
        if (!AudioEngine.initialized) {
            AudioEngine.init();
        }
    }, { once: true });

    const navBtns = document.querySelectorAll('.nav-btn');
    for (let i = 0; i < navBtns.length; i++) {
        navBtns[i].addEventListener('mouseenter', () => AudioEngine.playSFX('hover'));
        navBtns[i].addEventListener('click', () => AudioEngine.playSFX('select'));
    }

    LevelSelectUI.init(game, router);
};
