import {
    TILE_EMPTY, TILE_WALL, TILE_EXIT, TILE_BUTTON, TILE_LASER,
    TILE_KEY_RED, TILE_GATE_RED, TILE_ROLLER_RIGHT, TILE_ROLLER_LEFT,
    TILE_ROLLER_UP, TILE_ROLLER_DOWN, TILE_ICE, TILE_WARP_A, TILE_WARP_B,
    TILE_FRAGILE, TILE_HOLE
} from './entities.js';

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
        const gridMatrix = [];
        const initialBoxes = [];

        const warpPairs = {
            'A': [],
            'B': []
        };

        for (let y = 0; y < levelData.grid.height; y++) {
            const row = [];
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

                switch(token) {
                    case 'W': row.push(TILE_WALL); break;
                    case '.': row.push(TILE_EMPTY); break;
                    case 'E': row.push(TILE_EXIT); break;
                    case 'R>': row.push(TILE_ROLLER_RIGHT); break;
                    case 'R<': row.push(TILE_ROLLER_LEFT); break;
                    case 'R^': row.push(TILE_ROLLER_UP); break;
                    case 'Rv': row.push(TILE_ROLLER_DOWN); break;
                    case 'I': row.push(TILE_ICE); break;
                    case 'B': row.push(TILE_BUTTON); break;
                    case 'L': row.push(TILE_LASER); break;
                    case 'K_R': row.push(TILE_KEY_RED); break;
                    case 'G_R': row.push(TILE_GATE_RED); break;
                    case 'WA':
                        row.push(TILE_WARP_A);
                        warpPairs['A'].push({x,y});
                        break;
                    case 'WB':
                        row.push(TILE_WARP_B);
                        warpPairs['B'].push({x,y});
                        break;
                    case 'F': row.push(TILE_FRAGILE); break;
                    case 'H': row.push(TILE_HOLE); break;
                    case 'C':
                        row.push(TILE_EMPTY);
                        initialBoxes.push({x, y});
                        break;
                    default: row.push(TILE_EMPTY); break;
                }
                x++;
                i++;
            }
            gridMatrix.push(row);
        }

        // Strict mapping validation for Warp Nodes
        for (const [key, nodes] of Object.entries(warpPairs)) {
            if (nodes.length > 0 && nodes.length !== 2) {
                console.error(`COMPILATION ERROR: Warp Node pair '${key}' has ${nodes.length} nodes. Exactly 2 are required.`);
                alert(`COMPILATION ERROR: Warp Node pair '${key}' has ${nodes.length} nodes. Exactly 2 are required.`);
            }
        }

        const triggers = levelData.triggers || [];
        const receivers = levelData.receivers || [];

        return { gridMatrix, initialBoxes, triggers, receivers };
    }
}
