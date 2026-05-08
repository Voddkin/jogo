"use strict";
import { LEVEL_DATABASE } from './levels.js';
import { AudioEngine } from './audioEngine.js';

export class LevelSelectUI {
    static init(gameInstance, routerInstance) {
        this.game = gameInstance;
        this.router = routerInstance;
        this.container = document.getElementById('level-grid-container');
        this.renderLevelGrid();
    }

    static renderLevelGrid() {
        if (!this.container) return;

        // Clear without recreating the whole div tree if possible,
        // but for now innerHTML = '' is fine for full refresh
        this.container.innerHTML = '';

        const progress = window.SystemData.progress;

        for (let i = 0, len = LEVEL_DATABASE.length; i < len; i++) {
            const levelData = LEVEL_DATABASE[i];
            const levelId = levelData.id;

            const isUnlocked = progress.unlockedLevels.includes(levelId) || progress.completedLevels.includes(levelId);
            const isCompleted = progress.completedLevels.includes(levelId);

            const card = document.createElement('article');
            card.classList.add('level-card');

            if (isUnlocked) {
                card.classList.add('is-unlocked');
                if (isCompleted) {
                    card.classList.add('is-completed');
                }

                // Add Hover Audio Event
                card.addEventListener('mouseenter', () => AudioEngine.playSFX('hover'));

                // Add Click Routing
                card.addEventListener('click', () => {
                    AudioEngine.playSFX('select');
                    // Ensure the game logic starts the correct level
                    this.game.loadLevel(i);
                    this.router.maps('screen-game');
                });

                // Content for Unlocked Level
                const numBg = document.createElement('span');
                numBg.className = 'level-card__number-bg';
                numBg.innerText = levelId < 10 ? `0${levelId}` : levelId;

                const title = document.createElement('h3');
                title.className = 'level-card__title';
                title.innerText = levelData.name;

                card.appendChild(numBg);
                card.appendChild(title);

                // Completion Badge
                if (isCompleted) {
                    const badge = document.createElement('div');
                    badge.className = 'level-card__badge';
                    badge.innerText = '[ SOLVED ]';
                    card.appendChild(badge);

                    const optimal = progress.linesOfCode[levelId];
                    if (optimal !== undefined) {
                        const score = document.createElement('div');
                        score.className = 'level-card__score';
                        score.innerText = `Optimal Sequence: ${optimal} cmds`;
                        card.appendChild(score);
                    }
                }
            } else {
                card.classList.add('is-locked');

                // SVG Lock icon inline
                const lockIcon = document.createElement('div');
                lockIcon.className = 'level-card__lock';
                lockIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="32" height="32" fill="currentColor"><path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96ZM208,208H48V96H208V208Zm-80-72v32a8,8,0,0,1-16,0V136a8,8,0,0,1,16,0Z"></path></svg>`;
                card.appendChild(lockIcon);
            }

            this.container.appendChild(card);
        }
    }
}
