"use strict";
import { Game } from './game.js';
import { ScreenRouter } from './screenRouter.js';
import { AudioEngine } from './audioEngine.js';
import { LevelSelectUI } from './levelSelectUI.js';
import { LevelParser } from './levelParser.js';
import { LEVEL_DATABASE } from './levels.js';


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


function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

window.onload = () => {
    const validation = LevelParser.validateDatabaseIntegrity(LEVEL_DATABASE);
    if (!validation.valid) {
        Logger.error("FATAL ERROR: " + validation.error);
        const errToast = document.createElement('div');
        errToast.style.position = 'absolute';
        errToast.style.top = '10px';
        errToast.style.left = '50%';
        errToast.style.transform = 'translateX(-50%)';
        errToast.style.background = '#ff0033';
        errToast.style.color = '#fff';
        errToast.style.padding = '10px 20px';
        errToast.style.fontFamily = 'monospace';
        errToast.style.zIndex = '9999';
        errToast.innerText = "BOOT HALTED: " + validation.error;
        document.body.appendChild(errToast);
        return; // Abort game initialization
    }

    game = new Game('gameCanvas');
    router = new ScreenRouter(game);

    // Global Error Handlers (Anti-Blackscreen)
    const handleFatalError = (msg) => {
        if (game && game.uiManager) {
            game.uiManager.showToast(`SYSTEM FAILURE: ${msg}`, 'ERROR');
        }
        if (router && router.currentScreenId !== 'screen-menu') {
            router.maps('screen-menu');
        }
    };

    window.onerror = function(message, source, lineno, colno, error) {
        handleFatalError(message);
        return false; // Let it log to console still if open
    };

    window.addEventListener('unhandledrejection', function(event) {
        handleFatalError(event.reason);
    });

    // Global bindings for inline HTML onclick handlers
    window.addCommand = (cmd) => game.addCommand(cmd);
    window.executeQueue = () => game.executeQueue();
    window.clearQueue = () => game.clearQueue();
    window.removeLastCommand = () => { if (game) game.removeLastCommand(); };
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

    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
        if (!game || router.currentScreenId !== 'screen-game') return;

        switch (e.code) {
            case 'ArrowUp':
                e.preventDefault();
                window.addCommand('MOVE_FORWARD');
                break;
            case 'ArrowDown':
                e.preventDefault();
                window.addCommand('MOVE_BACKWARD');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                window.addCommand('TURN_LEFT');
                break;
            case 'ArrowRight':
                e.preventDefault();
                window.addCommand('TURN_RIGHT');
                break;
            case 'Space':
                e.preventDefault();
                window.addCommand('ACTIVATE_EMP');
                break;
            case 'Enter':
                e.preventDefault();
                window.executeQueue();
                break;
            case 'Backspace':
                e.preventDefault();
                if (window.removeLastCommand) {
                    window.removeLastCommand();
                }
                break;
        }
    });


    window.addEventListener('resize', debounce(() => {
        if (game) {
            game.resizeCanvas();
            if (router) {
                LevelSelectUI.renderLevelGrid(); // Re-render grid layout on resize
            }
        }
    }, 200));

};
