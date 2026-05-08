const fs = require('fs');

const content = `/**
 * Level Database
 *
 * Legend:
 * 'W' = Wall
 * '.' = Empty Floor
 * 'E' = Exit
 * 'R>' = Roller Right, 'R<' = Left, 'R^' = Up, 'Rv' = Down
 * 'I' = Ice
 * 'B' = Button
 * 'L' = Laser
 * 'G_R' = Gate Red
 * 'K_R' = Key Red
 * 'WA' / 'WB' = Warps
 * 'F' = Fragile
 * 'C' = Crate (Pushable Box)
 * 'H' = Hole/Abyss (Replaces F when walked over)
 */

export const LEVEL_DATABASE = [
    // MÓDULO 1: SETOR ALPHA - AQUECIMENTO LÓGICO
    {
        id: 1,
        name: "Level 01: Boot Sequence",
        grid: { width: 8, height: 6 },
        spawn: { x: 1, y: 1, direction: 0 }, // 0 = East
        layout: [
            "WWWWWWWW",
            "W......W",
            "WWWWWW.W",
            "W......W",
            "W.WWWWWW",
            "W.E....W",
            "WWWWWWWW"
        ]
    },
    {
        id: 2,
        name: "Level 02: Authorization",
        grid: { width: 8, height: 6 },
        spawn: { x: 1, y: 3, direction: 0 }, // East
        layout: [
            "WWWWWWWW",
            "W..K_R...W",
            "WWWWWW.W",
            "W......W",
            "W.G_R...E",
            "WWWWWWWW"
        ]
    },
    {
        id: 3,
        name: "Level 03: Kinetic Transfer",
        grid: { width: 6, height: 6 },
        spawn: { x: 1, y: 4, direction: 0 }, // East
        layout: [
            "WWWWWW",
            "W.B..W",
            "WW.W.W",
            "WE L.W",
            "W..C.W",
            "WWWWWW"
        ],
        triggers: [
            { id: 'btn_1', x: 2, y: 1, type: 'button' }
        ],
        receivers: [
            { id: 'laser_1', x: 3, y: 3, type: 'laser', requires: ['btn_1'], logic: 'AND' }
        ]
    },
    {
        id: 4,
        name: "Level 04: Electromagnetic Pulse",
        grid: { width: 8, height: 6 },
        spawn: { x: 1, y: 2, direction: 0 }, // East
        layout: [
            "WWWWWWWW",
            "W.B....W",
            "W......W",
            "W.B..L.W",
            "W....E.W",
            "WWWWWWWW"
        ],
        triggers: [
            { id: 'btn_1', x: 2, y: 1, type: 'button' },
            { id: 'btn_2', x: 2, y: 3, type: 'button' }
        ],
        receivers: [
            { id: 'laser_1', x: 5, y: 3, type: 'laser', requires: ['btn_1', 'btn_2'], logic: 'OR' }
        ]
    },

    // MÓDULO 2: SETOR BETA - INÉRCIA E ATRITO
    {
        id: 5,
        name: "Level 05: Frictionless Surface",
        grid: { width: 10, height: 8 },
        spawn: { x: 1, y: 6, direction: 0 }, // East
        layout: [
            "WWWWWWWWWW",
            "WK_RIIIIII.W",
            "WIIWIIIIEW",
            "WIIIIWIIWW",
            "WIIIIIIIWW",
            "WWIIWIIIWW",
            "W.IIIIIG_RW",
            "WWWWWWWWWW"
        ]
    },
    {
        id: 6,
        name: "Level 06: Conveyor Logistics",
        grid: { width: 8, height: 8 },
        spawn: { x: 1, y: 1, direction: 0 }, // East
        layout: [
            "WWWWWWWW",
            "W.R>R>R>RvW",
            "WR^WWWRvW",
            "WR^WBLEW",
            "WR^WWWRvW",
            "WR^R<R<R<W",
            "WWWWWWWW",
            "WWWWWWWW"
        ],
        triggers: [
            { id: 'btn_1', x: 3, y: 3, type: 'button' }
        ],
        receivers: [
            { id: 'laser_1', x: 4, y: 3, type: 'laser', requires: ['btn_1'], logic: 'AND' }
        ]
    },
    {
        id: 7,
        name: "Level 07: Vector Redirection",
        grid: { width: 8, height: 8 },
        spawn: { x: 1, y: 6, direction: 0 }, // East
        layout: [
            "WWWWWWWW",
            "W.BIIIIW",
            "WWWWIIEW",
            "W...W.LW",
            "W.C.W.WW",
            "W......W",
            "W......W",
            "WWWWWWWW"
        ],
        triggers: [
            { id: 'btn_1', x: 2, y: 1, type: 'button' }
        ],
        receivers: [
            { id: 'laser_1', x: 6, y: 3, type: 'laser', requires: ['btn_1'], logic: 'AND' }
        ]
    },
    {
        id: 8,
        name: "Level 08: Fragile Memory",
        grid: { width: 8, height: 8 },
        spawn: { x: 3, y: 6, direction: 3 }, // North
        layout: [
            "WWWWWWWW",
            "WK_RFFF.K_RW",
            "W.FFF..W",
            "W.FFF..W",
            "W.FFF..W",
            "W.FFF..W",
            "W..F.G_R.E",
            "WWWWWWWW"
        ]
    },

    // MÓDULO 3: SETOR GAMMA - CIRCUITOS COMPLEXOS
    {
        id: 9,
        name: "Level 09: Logic Gate AND",
        grid: { width: 8, height: 8 },
        spawn: { x: 1, y: 6, direction: 0 }, // East
        layout: [
            "WWWWWWWW",
            "W.B...BW",
            "W.C...CW",
            "W......W",
            "WW...L.W",
            "W......E",
            "W......W",
            "WWWWWWWW"
        ],
        triggers: [
            { id: 'btn_1', x: 2, y: 1, type: 'button' },
            { id: 'btn_2', x: 6, y: 1, type: 'button' }
        ],
        receivers: [
            { id: 'laser_1', x: 5, y: 4, type: 'laser', requires: ['btn_1', 'btn_2'], logic: 'AND' }
        ]
    },
    {
        id: 10,
        name: "Level 10: The Quantum Sorter",
        grid: { width: 10, height: 8 },
        spawn: { x: 1, y: 6, direction: 0 }, // East
        layout: [
            "WWWWWWWWWW",
            "W.C...WA.W",
            "WWWWWWWWWW",
            "WWB.B...EW",
            "WWWWWWWLWW",
            "W........W",
            "W........W",
            "WWWWWWWWWW"
        ],
        triggers: [
            { id: 'btn_1', x: 4, y: 3, type: 'button' }
        ],
        receivers: [
            { id: 'laser_1', x: 7, y: 4, type: 'laser', requires: ['btn_1'], logic: 'AND' }
        ]
    },
    {
        id: 11,
        name: "Level 11: Chain Reaction",
        grid: { width: 10, height: 10 },
        spawn: { x: 1, y: 8, direction: 0 }, // East
        layout: [
            "WWWWWWWWWW",
            "WWA.R>R>R>W",
            "WWWWWWW.RvW",
            "WWB.B...RvW",
            "WWWWW...RvW",
            "W.I.C...RvW",
            "WWWWW...RvW",
            "W...L...R<W",
            "W........E",
            "WWWWWWWWWW"
        ],
        triggers: [
            { id: 'btn_1', x: 4, y: 3, type: 'button' }
        ],
        receivers: [
            { id: 'laser_1', x: 4, y: 7, type: 'laser', requires: ['btn_1'], logic: 'AND' }
        ]
    },
    {
        id: 12,
        name: "Level 12: The Processor",
        grid: { width: 12, height: 12 },
        spawn: { x: 1, y: 10, direction: 0 }, // East
        layout: [
            "WWWWWWWWWWWW",
            "WWA.C....WBW",
            "W.WWWWW....W",
            "W.W...W..L.W",
            "W.W.B.W..E.W",
            "W.W...WWWWWW",
            "W.WIIIIII..W",
            "W.W......C.W",
            "W.WWWWWWWW.W",
            "W..........W",
            "W..........W",
            "WWWWWWWWWWWW"
        ],
        triggers: [
            { id: 'btn_1', x: 4, y: 4, type: 'button' }
        ],
        receivers: [
            { id: 'laser_1', x: 9, y: 3, type: 'laser', requires: ['btn_1'], logic: 'AND' }
        ]
    }
];
`;
fs.writeFileSync('js/levels.js', content);
