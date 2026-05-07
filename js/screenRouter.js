export class ScreenRouter {
    constructor(game) {
        this.game = game;
        this.screens = document.querySelectorAll('.screen');
        this.currentScreenId = 'screen-menu'; // Matches initial HTML state
    }

    maps(targetId) {
        if (this.currentScreenId === targetId) return;

        const currentScreen = document.getElementById(this.currentScreenId);
        const targetScreen = document.getElementById(targetId);

        if (!currentScreen || !targetScreen) {
            console.warn(`[ScreenRouter] Missing screen element. Transition failed from ${this.currentScreenId} to ${targetId}`);
            return;
        }

        // 1. Remove active class for fade out
        currentScreen.classList.remove('screen--active');

        // 2. Wait for CSS transition
        setTimeout(() => {
            currentScreen.style.display = 'none';

            // 3. Prepare target screen
            targetScreen.style.display = 'flex';

            // 4. Force reflow to restart CSS animation
            void targetScreen.offsetWidth;

            // 5. Add active class for fade in
            targetScreen.classList.add('screen--active');

            // 6. Lifecycle Hooks
            this.handleLifecycle(this.currentScreenId, 'exit');
            this.currentScreenId = targetId;
            this.handleLifecycle(targetId, 'enter');

        }, 400); // Matches var(--transition-smooth) -> 0.4s
    }

    handleLifecycle(screenId, phase) {
        if (screenId === 'screen-game') {
            if (phase === 'enter') {
                this.game.startSession();
            } else if (phase === 'exit') {
                this.game.pauseSession();
            }
        }
    }
}
