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
 * 'H' = Hole/Abyss (Replaces F when walked over)
 */

export const LEVEL_DATABASE = [
    {
        id: 1,
        name: "Level 01: Boot Sequence",
        grid: {
            width: 8,
            height: 7
        },
        spawn: {
            x: 1,
            y: 1,
            direction: 0
        },
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
        grid: {
            width: 8,
            height: 6
        },
        spawn: {
            x: 1,
            y: 3,
            direction: 0
        },
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
        grid: {
            width: 6,
            height: 6
        },
        spawn: {
            x: 1,
            y: 4,
            direction: 0
        },
        layout: [
            "WWWWWW",
            "W.B..W",
            "WW.W.W",
            "WE L.W",
            "W..C.W",
            "WWWWWW"
        ],
        triggers: [
            {
                id: "btn_1",
                x: 2,
                y: 1,
                type: "button"
            }
        ],
        receivers: [
            {
                id: "laser_1",
                x: 3,
                y: 3,
                type: "laser",
                requires: [
                    "btn_1"
                ],
                logic: "AND"
            }
        ]
    },
    {
        id: 4,
        name: "Level 04: Electromagnetic Pulse",
        grid: {
            width: 8,
            height: 6
        },
        spawn: {
            x: 1,
            y: 2,
            direction: 0
        },
        layout: [
            "WWWWWWWW",
            "W.B....W",
            "W......W",
            "W.B..L.W",
            "W....E.W",
            "WWWWWWWW"
        ],
        triggers: [
            {
                id: "btn_1",
                x: 2,
                y: 1,
                type: "button"
            },
            {
                id: "btn_2",
                x: 2,
                y: 3,
                type: "button"
            }
        ],
        receivers: [
            {
                id: "laser_1",
                x: 5,
                y: 3,
                type: "laser",
                requires: [
                    "btn_1",
                    "btn_2"
                ],
                logic: "OR"
            }
        ]
    },
    {
        id: 5,
        name: "Level 05: Frictionless Surface",
        grid: {
            width: 10,
            height: 8
        },
        spawn: {
            x: 1,
            y: 6,
            direction: 0
        },
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
        grid: {
            width: 8,
            height: 8
        },
        spawn: {
            x: 1,
            y: 1,
            direction: 0
        },
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
            {
                id: "btn_1",
                x: 4,
                y: 3,
                type: "button"
            }
        ],
        receivers: [
            {
                id: "laser_1",
                x: 5,
                y: 3,
                type: "laser",
                requires: [
                    "btn_1"
                ],
                logic: "AND"
            }
        ]
    },
    {
        id: 7,
        name: "Level 07: Vector Redirection",
        grid: {
            width: 8,
            height: 8
        },
        spawn: {
            x: 1,
            y: 6,
            direction: 0
        },
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
            {
                id: "btn_1",
                x: 2,
                y: 1,
                type: "button"
            }
        ],
        receivers: [
            {
                id: "laser_1",
                x: 6,
                y: 3,
                type: "laser",
                requires: [
                    "btn_1"
                ],
                logic: "AND"
            }
        ]
    },
    {
        id: 8,
        name: "Level 08: Fragile Memory",
        grid: {
            width: 8,
            height: 8
        },
        spawn: {
            x: 3,
            y: 6,
            direction: 3
        },
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
        grid: {
            width: 8,
            height: 8
        },
        spawn: {
            x: 1,
            y: 6,
            direction: 0
        },
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
            {
                id: "btn_1",
                x: 2,
                y: 1,
                type: "button"
            },
            {
                id: "btn_2",
                x: 6,
                y: 1,
                type: "button"
            }
        ],
        receivers: [
            {
                id: "laser_1",
                x: 5,
                y: 4,
                type: "laser",
                requires: [
                    "btn_1",
                    "btn_2"
                ],
                logic: "AND"
            }
        ]
    },
    {
        id: 10,
        name: "Level 10: The Quantum Sorter",
        grid: {
            width: 10,
            height: 8
        },
        spawn: {
            x: 1,
            y: 6,
            direction: 0
        },
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
            {
                id: "btn_1",
                x: 4,
                y: 3,
                type: "button"
            }
        ],
        receivers: [
            {
                id: "laser_1",
                x: 7,
                y: 4,
                type: "laser",
                requires: [
                    "btn_1"
                ],
                logic: "AND"
            }
        ]
    },
    {
        id: 11,
        name: "Level 11: Chain Reaction",
        grid: {
            width: 10,
            height: 10
        },
        spawn: {
            x: 1,
            y: 8,
            direction: 0
        },
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
            {
                id: "btn_1",
                x: 4,
                y: 3,
                type: "button"
            }
        ],
        receivers: [
            {
                id: "laser_1",
                x: 4,
                y: 7,
                type: "laser",
                requires: [
                    "btn_1"
                ],
                logic: "AND"
            }
        ]
    },
    {
        id: 12,
        name: "Level 12: The Processor",
        grid: {
            width: 12,
            height: 12
        },
        spawn: {
            x: 1,
            y: 10,
            direction: 0
        },
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
            {
                id: "btn_1",
                x: 4,
                y: 4,
                type: "button"
            }
        ],
        receivers: [
            {
                id: "laser_1",
                x: 9,
                y: 3,
                type: "laser",
                requires: [
                    "btn_1"
                ],
                logic: "AND"
            }
        ]
    },
    {
        id: 13,
        name: "Level 13: The Stasis Protocol",
        grid: {
            width: 10,
            height: 8
        },
        spawn: {
            x: 1,
            y: 1,
            direction: 1
        },
        layout: [
            "WWWWWWWWWW",
            "W...W.C.IW",
            "WW..W.L.IW",
            "W...W.I.IW",
            "W.B.W.B.IW",
            "WWWWWWWW.W",
            "W.L....K_REW",
            "WWWWWWWWWW"
        ],
        triggers: [
            {
                id: "btn_emp",
                x: 2,
                y: 4,
                type: "button"
            },
            {
                id: "btn_box",
                x: 6,
                y: 4,
                type: "button"
            }
        ],
        receivers: [
            {
                id: "laser_box",
                x: 6,
                y: 2,
                type: "laser",
                requires: [
                    "btn_emp"
                ],
                logic: "AND"
            },
            {
                id: "laser_player",
                x: 2,
                y: 6,
                type: "laser",
                requires: [
                    "btn_box"
                ],
                logic: "AND"
            }
        ]
    },
    {
        id: 14,
        name: "Level 14: Crate Bridging",
        grid: {
            width: 10,
            height: 8
        },
        spawn: {
            x: 1,
            y: 4,
            direction: 0
        },
        layout: [
            "WWWWWWWWWW",
            "W.W...I.CW",
            "W.W.C.I..W",
            "W...W.I..W",
            "W.W.W.I..W",
            "W.W.H.H.EW",
            "W.W...I..W",
            "WWWWWWWWWW"
        ]
    },
    {
        id: 15,
        name: "Level 15: Quantum Sokoban",
        grid: {
            width: 10,
            height: 8
        },
        spawn: {
            x: 1,
            y: 6,
            direction: 0
        },
        layout: [
            "WWWWWWWWWW",
            "W.R>R>R>R>WBWWW",
            "W.WAWWWWWWW",
            "W.C......W",
            "WWWWWWW.WW",
            "WWB.....L.W",
            "W.......EW",
            "WWWWWWWWWW"
        ],
        triggers: [
            {
                id: "btn_box",
                x: 2,
                y: 5,
                type: "button"
            }
        ],
        receivers: [
            {
                id: "laser_exit",
                x: 7,
                y: 5,
                type: "laser",
                requires: [
                    "btn_box"
                ],
                logic: "AND"
            }
        ]
    },
    {
        id: 16,
        name: "Level 16: The Phantom Circuit",
        grid: {
            width: 10,
            height: 8
        },
        spawn: {
            x: 1,
            y: 6,
            direction: 0
        },
        layout: [
            "WWWWWWWWWW",
            "W.C....C.W",
            "WWWWWWWW.W",
            "W.B.W.B..W",
            "W.B.W....W",
            "W...W.LLLW",
            "W.......EW",
            "WWWWWWWWWW"
        ],
        triggers: [
            {
                id: "btn_1",
                x: 2,
                y: 3,
                type: "button"
            },
            {
                id: "btn_2",
                x: 6,
                y: 3,
                type: "button"
            },
            {
                id: "btn_3",
                x: 2,
                y: 4,
                type: "button"
            }
        ],
        receivers: [
            {
                id: "laser_1",
                x: 6,
                y: 5,
                type: "laser",
                requires: [
                    "btn_1",
                    "btn_2",
                    "btn_3"
                ],
                logic: "AND"
            },
            {
                id: "laser_2",
                x: 7,
                y: 5,
                type: "laser",
                requires: [
                    "btn_1",
                    "btn_2",
                    "btn_3"
                ],
                logic: "AND"
            },
            {
                id: "laser_3",
                x: 8,
                y: 5,
                type: "laser",
                requires: [
                    "btn_1",
                    "btn_2",
                    "btn_3"
                ],
                logic: "AND"
            }
        ]
    },
    {
        id: 17,
        name: "Level 17: Euler's Nightmare",
        grid: {
            width: 10,
            height: 8
        },
        spawn: {
            x: 1,
            y: 1,
            direction: 0
        },
        layout: [
            "WWWWWWWWWW",
            "W.FFFFFF.W",
            "W.FFFFFW.W",
            "W.FFCFFW.W",
            "W.FFFFFW.W",
            "W.BFFF...W",
            "W.W.L...EW",
            "WWWWWWWWWW"
        ],
        triggers: [
            {
                id: "btn_1",
                x: 2,
                y: 5,
                type: "button"
            }
        ],
        receivers: [
            {
                id: "laser_1",
                x: 4,
                y: 6,
                type: "laser",
                requires: [
                    "btn_1"
                ],
                logic: "AND"
            }
        ]
    },
    {
        id: 18,
        name: "Level 18: Absolute Zero",
        grid: {
            width: 10,
            height: 8
        },
        spawn: {
            x: 1,
            y: 6,
            direction: 0
        },
        layout: [
            "WWWWWWWWWW",
            "WIIIIIIIIW",
            "WIIIIIIIIW",
            "WIIIIIIIIW",
            "WIIIIIIIIW",
            "W..C.IIIEW",
            "W...WIIIIW",
            "WWWWWWWWWW"
        ]
    },
    {
        id: 19,
        name: "Level 19: Asynchronous Deadlock",
        grid: {
            width: 10,
            height: 8
        },
        spawn: {
            x: 1,
            y: 1,
            direction: 0
        },
        layout: [
            "WWWWWWWWWW",
            "W.W.C.R>Rv.W",
            "W.W.R^W.Rv.W",
            "W.L.R^B.Rv.W",
            "W.W.R^R<R<R<WW",
            "W.WWWWWW.W",
            "W.......EW",
            "WWWWWWWWWW"
        ],
        triggers: [
            {
                id: "btn_1",
                x: 6,
                y: 3,
                type: "button"
            }
        ],
        receivers: [
            {
                id: "laser_1",
                x: 2,
                y: 3,
                type: "laser",
                requires: [
                    "btn_1"
                ],
                logic: "AND"
            }
        ]
    },
    {
        id: 20,
        name: "Level 20: Voddkin's Core",
        grid: {
            width: 15,
            height: 15
        },
        spawn: {
            x: 1,
            y: 1,
            direction: 0
        },
        layout: [
            "WWWWWWWWWWWWWWW",
            "W.I...I.......W",
            "W.IC..I.......W",
            "W.I.C.I.......W",
            "W.I.C.I.......W",
            "W.............W",
            "W..WA........WB.W",
            "W.............W",
            "W.......W.....W",
            "W...F.B.W.....W",
            "W.......W.....W",
            "WLLLLL........W",
            "W...E.........W",
            "W.............W",
            "WWWWWWWWWWWWWWW"
        ],
        triggers: [
            {
                id: "btn_1",
                x: 6,
                y: 9,
                type: "button"
            },
            {
                id: "btn_2",
                x: 1,
                y: 5,
                type: "button"
            },
            {
                id: "btn_3",
                x: 13,
                y: 5,
                type: "button"
            },
            {
                id: "btn_4",
                x: 6,
                y: 5,
                type: "button"
            }
        ],
        receivers: [
            {
                id: "laser_1",
                x: 1,
                y: 11,
                type: "laser",
                requires: [
                    "btn_1",
                    "btn_2"
                ],
                logic: "OR"
            },
            {
                id: "laser_2",
                x: 2,
                y: 11,
                type: "laser",
                requires: [
                    "btn_1"
                ],
                logic: "AND"
            },
            {
                id: "laser_3",
                x: 3,
                y: 11,
                type: "laser",
                requires: [
                    "btn_1",
                    "btn_3"
                ],
                logic: "OR"
            },
            {
                id: "laser_4",
                x: 4,
                y: 11,
                type: "laser",
                requires: [
                    "btn_1",
                    "btn_4"
                ],
                logic: "AND"
            },
            {
                id: "laser_5",
                x: 5,
                y: 11,
                type: "laser",
                requires: [
                    "btn_1"
                ],
                logic: "AND"
            }
        ]
    }
];
