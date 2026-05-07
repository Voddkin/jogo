export const LEVELS = [
    {
        id: 1,
        name: "Level 01: Hello World",
        width: 6,
        height: 3,
        robotStart: { x: 1, y: 1, dir: 0 }, // 0 = East
        layout: [
            ['W', 'W', 'W', 'W', 'W', 'W'],
            ['W', '.', '.', '.', 'E', 'W'],
            ['W', 'W', 'W', 'W', 'W', 'W']
        ]
    },
    {
        id: 2,
        name: "Level 02: Red Key",
        width: 7,
        height: 5,
        robotStart: { x: 1, y: 3, dir: 0 }, // 0 = East
        layout: [
            ['W', 'W', 'W', 'W', 'W', 'W', 'W'],
            ['W', '.', '.', '.', 'G_R', 'E', 'W'],
            ['W', '.', 'W', 'W', 'W', 'W', 'W'],
            ['W', '.', 'K_R', '.', '.', '.', 'W'],
            ['W', 'W', 'W', 'W', 'W', 'W', 'W']
        ]
    },
    {
        id: 3,
        name: "Level 03: EMP",
        width: 8,
        height: 5,
        robotStart: { x: 1, y: 2, dir: 0 }, // 0 = East
        layout: [
            ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
            ['W', '.', '.', '.', 'W', 'E', '.', 'W'],
            ['W', '.', 'B', '.', 'L', '.', '.', 'W'],
            ['W', '.', '.', '.', 'W', 'W', 'W', 'W'],
            ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W']
        ]
    },
    {
        id: 4,
        name: "Level 04: Advanced Mechanics",
        width: 9,
        height: 9,
        robotStart: { x: 1, y: 7, dir: 0 },
        layout: [
            ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
            ['W', '.', 'I', 'I', 'I', 'WB', 'W', 'E', 'W'],
            ['W', '.', 'W', 'W', 'W', 'W', 'W', '.', 'W'],
            ['W', '.', 'W', 'R<', 'R<', 'R^', 'W', 'F', 'W'],
            ['W', '.', 'W', 'Rv', 'W', 'R^', 'W', 'F', 'W'],
            ['W', '.', 'W', 'R>', 'R>', 'R^', 'W', 'F', 'W'],
            ['W', '.', 'W', 'W', 'W', 'W', 'W', '.', 'W'],
            ['W', '.', 'WA', 'W', '.', '.', '.', '.', 'W'],
            ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W']
        ]
    },
    {
        id: 5,
        name: "Level 05: Sokoban",
        width: 8,
        height: 6,
        robotStart: { x: 1, y: 4, dir: 0 },
        layout: [
            ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
            ['W', '.', 'B', 'W', '.', 'E', '.', 'W'],
            ['W', '.', '.', 'L', '.', '.', '.', 'W'],
            ['W', '.', 'C', 'W', 'W', 'W', 'W', 'W'],
            ['W', '.', '.', '.', '.', '.', '.', 'W'],
            ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W']
        ]
    }
];
