/**
 * Factory for creating SVG-based command blocks for the timeline.
 */
class CommandBlockFactory {
    static create(type, index) {
        const block = document.createElement('div');
        block.classList.add('cmd-block', `cmd-block--${type}`);
        block.dataset.index = index;

        let svgContent = '';
        switch(type) {
            case 'MOVE_FORWARD':
                svgContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M213.66,122.34a8,8,0,0,1-11.32,11.32L136,67.31V216a8,8,0,0,1-16,0V67.31L53.66,133.66a8,8,0,0,1-11.32-11.32l80-80a8,8,0,0,1,11.32,0Z"></path></svg>';
                break;
            case 'MOVE_BACKWARD':
                svgContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M205.66,149.66l-80,80a8,8,0,0,1-11.32,0l-80-80a8,8,0,0,1,11.32-11.32L120,212.69V40a8,8,0,0,1,16,0V212.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path></svg>';
                break;
            case 'TURN_LEFT':
                svgContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M224,128a96,96,0,0,1-94.71,96H128A95.38,95.38,0,0,1,62.1,196.4a8,8,0,1,1,11.8-10.8A79.44,79.44,0,0,0,128,208h1.07A80,80,0,0,0,128,48h-8.8l20.4,20.4a8,8,0,0,1-11.32,11.31l-34.34-34.34a8,8,0,0,1,0-11.32l34.34-34.34a8,8,0,0,1,11.32,11.32L119.2,32H128A96.11,96.11,0,0,1,224,128Z"></path></svg>';
                break;
            case 'TURN_RIGHT':
                svgContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M193.9,196.4a8,8,0,1,1-11.8-10.8A79.44,79.44,0,0,0,128,208h-1.07A80,80,0,0,1,128,48h8.8L115.33,68.4a8,8,0,0,0,11.32,11.31l34.34-34.34a8,8,0,0,0,0-11.32l-34.34-34.34a8,8,0,0,0-11.32,11.32L136.8,32H128A96,96,0,0,0,128,224h1.29A95.38,95.38,0,0,0,193.9,196.4Z"></path></svg>';
                break;
            case 'ACTIVATE_EMP':
                svgContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M215.79,118.17a8,8,0,0,0-5-5.66L153.18,90.9l14.66-73.33a8,8,0,0,0-13.69-7l-112,120a8,8,0,0,0,3,13l57.63,21.61L88.16,238.43a8,8,0,0,0,13.69,7l112-120A8,8,0,0,0,215.79,118.17ZM109.37,214l10.47-52.38a8,8,0,0,0-5-9.06L62,132.71l84.62-90.66L136.16,94.43a8,8,0,0,0,5,9.06l52.8,19.8Z"></path></svg>';
                break;
        }

        block.innerHTML = `
            ${svgContent}
            <button class="cmd-block__delete" aria-label="Remove Command">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>
            </button>
        `;

        return block;
    }
}

/**
 * UIManager
 * Handles all DOM manipulation for the Timeline Code Rail, syncing state without full repaints.
 */
export class UIManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.track = document.getElementById('timeline-track');
        this.btnExecute = document.getElementById('btn-execute');
        this.btnClear = document.getElementById('btn-clear');
        this.statusText = document.getElementById('execution-status');
        this.toolbarButtons = document.querySelectorAll('.toolbar .btn');
        this.placeholder = document.querySelector('.timeline__placeholder');

        this.MAX_COMMANDS = 30;

        this.initDelegation();
    }

    initDelegation() {
        // Event delegation for individual block deletion
        this.track.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.cmd-block__delete');
            if (deleteBtn) {
                const block = deleteBtn.closest('.cmd-block');
                const index = parseInt(block.dataset.index, 10);
                this.game.removeCommandAt(index);
            }
        });
    }

    /**
     * Re-renders the indices in the DOM to match the array state after a splice.
     */
    reindexBlocks() {
        const blocks = this.track.querySelectorAll('.cmd-block:not(.is-removing)');
        blocks.forEach((block, idx) => {
            block.dataset.index = idx;
        });
    }

    /**
     * Syncs the visual queue state. Adds individual items or manages emptiness.
     * Called by the Game state machine.
     */
    syncTimeline(commandQueue) {
        const visibleCommands = commandQueue.filter(cmd => !cmd.startsWith('SYS_'));

        // Handle limits
        if (visibleCommands.length >= this.MAX_COMMANDS) {
            this.toolbarButtons.forEach(btn => {
                btn.classList.add('is-disabled');
                btn.title = "Limite de sequência atingido";
            });
        } else if (this.game.state === 'IDLE') {
            this.toolbarButtons.forEach(btn => {
                btn.classList.remove('is-disabled');
                btn.title = "";
            });
        }

        // Handle Empty State
        if (visibleCommands.length === 0) {
            this.track.innerHTML = '';
            this.track.appendChild(this.placeholder);
            this.placeholder.style.display = 'block';
            return;
        }

        // Hide Placeholder
        if (this.placeholder && this.placeholder.parentNode) {
            this.placeholder.style.display = 'none';
        }

        // If a new command was appended (array length > DOM length)
        const currentBlocks = this.track.querySelectorAll('.cmd-block:not(.is-removing)');
        if (visibleCommands.length > currentBlocks.length) {
            // Append only the newest elements
            for (let i = currentBlocks.length; i < visibleCommands.length; i++) {
                const cmd = visibleCommands[i];
                const block = CommandBlockFactory.create(cmd, i);
                this.track.appendChild(block);
            }

            // Auto scroll to end
            requestAnimationFrame(() => {
                this.track.scrollTo({ left: this.track.scrollWidth, behavior: 'smooth' });
            });
        }
    }

    /**
     * Removes a specific block from the DOM with an animation.
     */
    removeBlock(index) {
        const block = this.track.querySelector(`.cmd-block[data-index="${index}"]`);
        if (block) {
            block.classList.add('is-removing');
            block.addEventListener('transitionend', () => {
                if (block.parentNode) {
                    block.parentNode.removeChild(block);
                    this.reindexBlocks();
                    if (this.track.querySelectorAll('.cmd-block:not(.is-removing)').length === 0) {
                        this.track.appendChild(this.placeholder);
                        this.placeholder.style.display = 'block';
                    }
                }
            }, { once: true });
        }
    }

    /**
     * Clears all blocks with an animation.
     */
    clearTimeline() {
        const blocks = this.track.querySelectorAll('.cmd-block:not(.is-removing)');
        blocks.forEach(block => {
            block.classList.add('is-removing');
            block.addEventListener('transitionend', () => {
                if (block.parentNode) block.parentNode.removeChild(block);
            }, { once: true });
        });

        setTimeout(() => {
            this.track.innerHTML = '';
            this.track.appendChild(this.placeholder);
            this.placeholder.style.display = 'block';
        }, 150); // Matches var(--transition-fast)
    }

    triggerErrorShake() {
        this.btnExecute.classList.remove('error-shake');
        // Force reflow
        void this.btnExecute.offsetWidth;
        this.btnExecute.classList.add('error-shake');
    }

    /**
     * Updates UI lock states depending on the State Machine.
     */
    updateStateStatus(state) {
        if (state === 'EXECUTING' || state === 'ANIMATING') {
            this.statusText.innerText = "RUNNING";
            this.statusText.className = "panel__status is-running";

            this.toolbarButtons.forEach(btn => btn.classList.add('is-disabled'));
            this.btnExecute.classList.add('is-disabled');
            this.btnClear.classList.add('is-disabled');
            this.track.classList.add('is-locked');
        } else {
            this.statusText.innerText = state;
            this.statusText.className = "panel__status";

            this.toolbarButtons.forEach(btn => btn.classList.remove('is-disabled'));
            this.btnExecute.classList.remove('is-disabled');
            this.btnClear.classList.remove('is-disabled');
            this.track.classList.remove('is-locked');
        }
    }

    highlightExecutingBlock(index) {
        const blocks = this.track.querySelectorAll('.cmd-block');
        blocks.forEach((el, idx) => {
            el.classList.remove('is-executing');
            if (idx < index) {
                el.classList.add('is-executed');
            }
        });

        const activeEl = this.track.querySelector(`.cmd-block[data-index="${index}"]`);
        if (activeEl) {
            activeEl.classList.add('is-executing');
            activeEl.classList.remove('is-executed');

            // Auto scroll to center the active element
            const scrollPos = activeEl.offsetLeft - this.track.clientWidth / 2 + activeEl.clientWidth / 2;
            this.track.scrollTo({ left: scrollPos, behavior: 'smooth' });
        }
    }

    resetHighlights() {
        const blocks = this.track.querySelectorAll('.cmd-block');
        blocks.forEach(el => {
            el.classList.remove('is-executing');
            el.classList.remove('is-executed');
        });
        this.track.scrollTo({ left: 0, behavior: 'smooth' });
    }
}