const fs = require('fs');

function tokenize(str) {
    let tokens = [];
    let i = 0;
    while(i < str.length) {
        let t = str[i];
        if (i + 2 < str.length && str.substring(i, i+3) === 'K_R') { t = 'K_R'; i += 2; }
        else if (i + 2 < str.length && str.substring(i, i+3) === 'G_R') { t = 'G_R'; i += 2; }
        else if (i + 1 < str.length && str.substring(i, i+2) === 'R>') { t = 'R>'; i += 1; }
        else if (i + 1 < str.length && str.substring(i, i+2) === 'R<') { t = 'R<'; i += 1; }
        else if (i + 1 < str.length && str.substring(i, i+2) === 'R^') { t = 'R^'; i += 1; }
        else if (i + 1 < str.length && str.substring(i, i+2) === 'Rv') { t = 'Rv'; i += 1; }
        else if (i + 1 < str.length && str.substring(i, i+2) === 'WA') { t = 'WA'; i += 1; }
        else if (i + 1 < str.length && str.substring(i, i+2) === 'WB') { t = 'WB'; i += 1; }
        tokens.push(t);
        i++;
    }
    return tokens;
}

const db = [
    {
        id: 1,
        name: "Level 01: Boot Sequence",
        grid: { width: 8, height: 7 },
        spawn: { x: 1, y: 1, direction: 0 },
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
        spawn: { x: 1, y: 3, direction: 0 },
        layout: [
            "WWWWWWWW",
            "W.K_R....W",
            "WWWWWW.W",
            "W......W",
            "W.G_R...EW",
            "WWWWWWWW"
        ]
    },
    {
        id: 3,
        name: "Level 03: Kinetic Transfer",
        grid: { width: 6, height: 6 },
        spawn: { x: 1, y: 4, direction: 0 },
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
        spawn: { x: 1, y: 2, direction: 0 },
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
    {
        id: 5,
        name: "Level 05: Frictionless Surface",
        grid: { width: 10, height: 8 },
        spawn: { x: 1, y: 6, direction: 0 },
        layout: [
            "WWWWWWWWWW",
            "WK_RIIIIII.W",
            "WIIWIIIIEW",
            "WIIIIWIIWW",
            "WIIIIIIIWW",
            "WWIIWIIIWW",
            "W.IIIIIIG_RW",
            "WWWWWWWWWW"
        ]
    },
    {
        id: 6,
        name: "Level 06: Conveyor Logistics",
        grid: { width: 8, height: 8 },
        spawn: { x: 1, y: 1, direction: 0 },
        layout: [
            "WWWWWWWW",
            "W.R>R>R>R>RvW",
            "WR^WWWWRvW",
            "WR^W.BLEW",
            "WR^WWWWRvW",
            "WR^R<R<R<R<R<W",
            "WWWWWWWW",
            "WWWWWWWW"
        ],
        triggers: [
            { id: 'btn_1', x: 4, y: 3, type: 'button' }
        ],
        receivers: [
            { id: 'laser_1', x: 5, y: 3, type: 'laser', requires: ['btn_1'], logic: 'AND' }
        ]
    },
    {
        id: 7,
        name: "Level 07: Vector Redirection",
        grid: { width: 8, height: 8 },
        spawn: { x: 1, y: 6, direction: 0 },
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
        spawn: { x: 3, y: 6, direction: 3 },
        layout: [
            "WWWWWWWW",
            "WK_RFFF.K_RW",
            "W.FFF..W",
            "W.FFF..W",
            "W.FFF..W",
            "W.FFF..W",
            "W.F.G_R.EW",
            "WWWWWWWW"
        ]
    },
    {
        id: 9,
        name: "Level 09: Logic Gate AND",
        grid: { width: 8, height: 8 },
        spawn: { x: 1, y: 6, direction: 0 },
        layout: [
            "WWWWWWWW",
            "W.B...BW",
            "W.C...CW",
            "W......W",
            "WW...L.W",
            "W.....EW",
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
        spawn: { x: 1, y: 6, direction: 0 },
        layout: [
            "WWWWWWWWWW",
            "W.C....WA.W",
            "WWWWWWWWWW",
            "WWB.B....EW",
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
        spawn: { x: 1, y: 8, direction: 0 },
        layout: [
            "WWWWWWWWWW",
            "WWA.R>R>R>R>R>RvW",
            "WWWWWWW.RvW",
            "WWB.B....RvW",
            "WWWWW...RvW",
            "W.I.C...RvW",
            "WWWWW...RvW",
            "W...L...R<W",
            "W.......EW",
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
        spawn: { x: 1, y: 10, direction: 0 },
        layout: [
            "WWWWWWWWWWWW",
            "WWA.C......WBW",
            "W.WWWWWW...W",
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

let failed = false;
db.forEach(lvl => {
    let h = lvl.layout.length;
    if (h !== lvl.grid.height) {
        console.error(`Level ${lvl.id} height mismatch. Expected ${lvl.grid.height}, got ${h}`);
        failed = true;
    }
    lvl.layout.forEach((row, i) => {
        let t = tokenize(row);
        if (t.length !== lvl.grid.width) {
            console.error(`Level ${lvl.id} row ${i} width mismatch. Expected ${lvl.grid.width}, got ${t.length}: "${row}"`);
            failed = true;
        }
    });
});

if (failed) {
    console.error("Fix issues before writing.");
    process.exit(1);
}

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

export const LEVEL_DATABASE = ${JSON.stringify(db, null, 4).replace(/"([^"]+)":/g, '$1:')};
`;

fs.writeFileSync('js/levels.js', content);
console.log("Written successfully.");
