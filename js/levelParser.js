import {
    TILE_EMPTY, TILE_WALL, TILE_EXIT, TILE_BUTTON, TILE_LASER,
    TILE_KEY_RED, TILE_GATE_RED, TILE_ROLLER_RIGHT, TILE_ROLLER_LEFT,
    TILE_ROLLER_UP, TILE_ROLLER_DOWN, TILE_ICE, TILE_WARP_A, TILE_WARP_B,
    TILE_FRAGILE, TILE_HOLE, TILE_ABYSS, MASK_SOLID, MASK_TRIGGER, MASK_CORRUPTED
} from './entities.js';
import { Logger } from './logger.js';

/**
 * LevelParser
 * Responsible for ingesting a Level Object from LEVEL_DATABASE and outputting
 * data structures consumable by GridMap and Game engines.
 */
export class LevelParser {

    /**
     * Parses the layout array of strings into a 2D array of tile constants.
     * Extracts dynamic entities like Crates.
     * @param {Object} levelData - The level object from LEVEL_DATABASE
     * @returns {Object} { gridMatrix: number[][], initialBoxes: Object[] }
     */
    static parse(levelData) {
        const grid1D = new Uint32Array(levelData.grid.width * levelData.grid.height);
        const initialBoxes = [];

        const warpPairs = {
            'A': [],
            'B': []
        };

        let index = 0;

        for (let y = 0; y < levelData.grid.height; y++) {
            // Some cells might take more than 1 char (e.g. 'R>'), so we need to match carefully
            // However, looking at the layout format: "W.K_R..EW"
            // Wait, standard strings in JS split by character. But we have tokens like "K_R".
            // Let's use a regex or manual tokenization. The prompt showed an array of strings like:
            // "W.K_R..EW" -> wait, if it's a single string per row, we need to tokenize it.
            // Actually, we can use a Regex to match tokens, or simply split by a space if we enforce space separation.
            // The prompt gave: layout: ["WWWWWW", "W.K_R..EW"]
            // If "K_R" is 3 characters, we can't just iterate char by char blindly without lookahead.

            // Tokenizer approach:
            let str = levelData.layout[y];
            let x = 0;
            let i = 0;
            while(i < str.length) {
                let token = str[i];
                // Check multi-character tokens
                if (i + 2 < str.length && str.substring(i, i+3) === 'K_R') { token = 'K_R'; i += 2; }
                else if (i + 2 < str.length && str.substring(i, i+3) === 'G_R') { token = 'G_R'; i += 2; }
                else if (i + 1 < str.length && str.substring(i, i+2) === 'R>') { token = 'R>'; i += 1; }
                else if (i + 1 < str.length && str.substring(i, i+2) === 'R<') { token = 'R<'; i += 1; }
                else if (i + 1 < str.length && str.substring(i, i+2) === 'R^') { token = 'R^'; i += 1; }
                else if (i + 1 < str.length && str.substring(i, i+2) === 'Rv') { token = 'Rv'; i += 1; }
                else if (i + 1 < str.length && str.substring(i, i+2) === 'WA') { token = 'WA'; i += 1; }
                else if (i + 1 < str.length && str.substring(i, i+2) === 'WB') { token = 'WB'; i += 1; }

                let type = TILE_EMPTY;
                let mask = 0;

                switch(token) {
                    case 'W': type = TILE_WALL; mask |= MASK_SOLID; break;
                    case '.': type = TILE_EMPTY; break;
                    case 'E': type = TILE_EXIT; break;
                    case 'R>': type = TILE_ROLLER_RIGHT; break;
                    case 'R<': type = TILE_ROLLER_LEFT; break;
                    case 'R^': type = TILE_ROLLER_UP; break;
                    case 'Rv': type = TILE_ROLLER_DOWN; break;
                    case 'I': type = TILE_ICE; break;
                    case 'B': type = TILE_BUTTON; mask |= MASK_TRIGGER; break;
                    case 'L': type = TILE_LASER; break;
                    case 'K_R': type = TILE_KEY_RED; break;
                    case 'G_R': type = TILE_GATE_RED; break;
                    case 'WA':
                        type = TILE_WARP_A;
                        warpPairs['A'].push({x,y});
                        break;
                    case 'WB':
                        type = TILE_WARP_B;
                        warpPairs['B'].push({x,y});
                        break;
                    case 'F': type = TILE_FRAGILE; break;
                    case 'H': type = TILE_HOLE; mask |= MASK_SOLID; break;
                    case 'C':
                        type = TILE_EMPTY;
                        initialBoxes.push({x, y});
                        break;
                    default: type = TILE_EMPTY; break;
                }

                grid1D[index] = type | mask;
                index++;
                x++;
                i++;
            }
        }

        // Strict mapping validation for Warp Nodes
        for (const [key, nodes] of Object.entries(warpPairs)) {
            if (nodes.length > 0 && nodes.length !== 2) {
                Logger.error(`COMPILATION ERROR: Warp Node pair '${key}' has ${nodes.length} nodes. Exactly 2 are required.`);
            }
        }

        const triggers = levelData.triggers || [];
        const receivers = levelData.receivers || [];

        return { grid1D, initialBoxes, triggers, receivers };
    }
}
