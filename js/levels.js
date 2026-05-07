/**
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
 */

export const LEVEL_DATABASE = [
    {
        id: 1,
        name: "Level 01: Initiation",
        grid: { width: 6, height: 4 },
        spawn: { x: 1, y: 1, direction: 0 }, // 0 = East
        layout: [
            "WWWWWW",
            "W...EW",
            "W.W..W",
            "WWWWWW"
        ]
    },
    {
        id: 2,
        name: "Level 02: Corridors & Keys",
        grid: { width: 8, height: 6 },
        spawn: { x: 1, y: 4, direction: 0 }, // East
        layout: [
            "WWWWWWWW",
            "W.K_R...EW",
            "W.WWG_R.WW",
            "W......W",
            "W.WWWW.W",
            "WWWWWWWW"
        ]
    },
    {
        id: 3,
        name: "Level 03: Sokoban Protocol",
        grid: { width: 8, height: 6 },
        spawn: { x: 1, y: 4, direction: 0 }, // East
        layout: [
            "WWWWWWWW",
            "W.B.W.EW",
            "W...L..W",
            "W.C.WWWW",
            "W......W",
            "WWWWWWWW"
        ]
    }
];
