"use strict";
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


// Deep Freeze to ensure Imutability
function deepFreeze(object) {
    const propNames = Object.getOwnPropertyNames(object);
    for (let name of propNames) {
        let value = object[name];
        if (value && typeof value === "object") {
            deepFreeze(value);
        }
    }
    return Object.freeze(object);
}

export const LEVEL_DATABASE = deepFreeze([
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
        ],
        optimalCommands: 5
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
        ],
        optimalCommands: 4
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
        ],
        optimalCommands: 5
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
        ],
        optimalCommands: 6
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
        ],
        optimalCommands: 8
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
        ],
        optimalCommands: 10
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
        ],
        optimalCommands: 10
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
        ],
        optimalCommands: 12
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
        ],
        optimalCommands: 11
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
        ],
        optimalCommands: 9
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
        ],
        optimalCommands: 14
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
        ],
        optimalCommands: 15
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
        ],
        optimalCommands: 12
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
        ],
        optimalCommands: 8
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
            "W.B....L.W",
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
        ],
        optimalCommands: 12
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
        ],
        optimalCommands: 18
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
        ],
        optimalCommands: 15
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
        ],
        optimalCommands: 10
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
        ],
        optimalCommands: 15
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
        ],
        optimalCommands: 25
    },
    {
        id: 21,
        name: "Level 21: Schrödinger's Crate",
        optimalCommands: 14,
        grid: {
            width: 12,
            height: 10
        },
        spawn: {
            x: 1,
            y: 1,
            direction: 1
        },
        layout: [
            "WWWWWWWWWWWW",
            "W...W.C....W",
            "W.I.W.I...LW",
            "WWA..WWB....LW",
            "W.B.W.I...LW",
            "W.B.W.I...LW",
            "W.B.W.I...LW",
            "W.B.W.I...LW",
            "WWWWWWWW.BEW",
            "WWWWWWWWWWWW"
        ],
        triggers: [
            {
                id: "btn_1",
                x: 2,
                y: 4,
                type: "button"
            },
            {
                id: "btn_2",
                x: 2,
                y: 5,
                type: "button"
            },
            {
                id: "btn_3",
                x: 2,
                y: 6,
                type: "button"
            },
            {
                id: "btn_4",
                x: 2,
                y: 7,
                type: "button"
            },
            {
                id: "btn_box1",
                x: 7,
                y: 8,
                type: "button"
            }
        ],
        receivers: [
            {
                id: "laser_1",
                x: 9,
                y: 2,
                type: "laser",
                requires: [
                    "btn_1"
                ],
                logic: "AND"
            },
            {
                id: "laser_2",
                x: 9,
                y: 3,
                type: "laser",
                requires: [
                    "btn_2"
                ],
                logic: "AND"
            },
            {
                id: "laser_3",
                x: 9,
                y: 4,
                type: "laser",
                requires: [
                    "btn_3"
                ],
                logic: "AND"
            },
            {
                id: "laser_4",
                x: 9,
                y: 5,
                type: "laser",
                requires: [
                    "btn_4"
                ],
                logic: "AND"
            },
            {
                id: "laser_5",
                x: 9,
                y: 6,
                type: "laser",
                requires: [
                    "btn_1",
                    "btn_2"
                ],
                logic: "OR"
            },
            {
                id: "laser_6",
                x: 9,
                y: 7,
                type: "laser",
                requires: [
                    "btn_3",
                    "btn_4"
                ],
                logic: "OR"
            }
        ]
    },
    {
        id: 22,
        name: "Level 22: Memory Leak",
        optimalCommands: 21,
        grid: {
            width: 10,
            height: 11
        },
        spawn: {
            x: 1,
            y: 8,
            direction: 3
        },
        layout: [
            "WWWWWWWWWW",
            "WHFHFH.K_R.W",
            "WHFHFHFFFH",
            "WFFFFFFFFW",
            "WHFHFHFHFW",
            "WK_RFFFFK_RFFW",
            "WK_RFFFF.K_RFW",
            "WFFFFFFFFW",
            "WFF.FF...W",
            "W.FWW...EW",
            "WWWWWWWWWW"
        ]
    },
    {
        id: 23,
        name: "Level 23: EMP Resonance",
        optimalCommands: 18,
        grid: {
            width: 10,
            height: 10
        },
        spawn: {
            x: 4,
            y: 4,
            direction: 0
        },
        layout: [
            "WWWWWWWWWW",
            "W..R>R>R>R>R>RvW",
            "WR^.WWWW.RvW",
            "WR^.W..W.RvW",
            "WR^.W.CW.RvW",
            "WR^.W..W.RvW",
            "WR^.WWWW.RvW",
            "W..R<R<R<R<B.W",
            "W........E",
            "WWWWWWWWWW"
        ],
        triggers: [
            {
                id: "btn_emp",
                x: 4,
                y: 4,
                type: "button"
            },
            {
                id: "btn_box",
                x: 6,
                y: 7,
                type: "button"
            }
        ],
        receivers: [
            {
                id: "laser_1",
                x: 7,
                y: 8,
                type: "laser",
                requires: [
                    "btn_emp",
                    "btn_box"
                ],
                logic: "AND"
            }
        ]
    },
    {
        id: 24,
        name: "Level 24: Deadlock Resolver",
        optimalCommands: 22,
        grid: {
            width: 10,
            height: 10
        },
        spawn: {
            x: 1,
            y: 1,
            direction: 1
        },
        layout: [
            "WWWWWWWWWW",
            "W...W....W",
            "W.C.W.R>EEW",
            "W...I.R>WWW",
            "W.C.I.R>WWW",
            "W...I.R>WWW",
            "WWWWW.R>WWW",
            "W.....R>WWW",
            "W...W.R>WWW",
            "WWWWWWWWWW"
        ]
    },
    {
        id: 25,
        name: "Level 25: VODDKIN_MASTER_CONTROL",
        optimalCommands: 28,
        grid: {
            width: 15,
            height: 15
        },
        spawn: {
            x: 7,
            y: 13,
            direction: 3
        },
        layout: [
            "WWWWWWWWWWWWWWW",
            "WWA.C.I.I.C.WB..W",
            "W...W.I.I.W...W",
            "W.B.W.I.I.W.B.W",
            "W...W.I.I.W...W",
            "WWWWWW.C.WWWWWW",
            "W.R>R>R>R>R>R>R>R>R>R>R>.W",
            "W..I..E..I....W",
            "W.R<R<R<R<R<R<R<R<R<R<R<.W",
            "WWWWWW.B.WWWWWW",
            "W...W.I.I.W...W",
            "W.L.W.I.I.W.L.W",
            "W.B.W.I.I.W.B.W",
            "W.....I.I.....W",
            "WWWWWWWWWWWWWWW"
        ],
        triggers: [
            {
                id: "btn_tl",
                x: 2,
                y: 3,
                type: "button"
            },
            {
                id: "btn_tr",
                x: 12,
                y: 3,
                type: "button"
            },
            {
                id: "btn_bl",
                x: 2,
                y: 12,
                type: "button"
            },
            {
                id: "btn_br",
                x: 12,
                y: 12,
                type: "button"
            },
            {
                id: "btn_mid",
                x: 7,
                y: 9,
                type: "button"
            }
        ],
        receivers: [
            {
                id: "laser_tl",
                x: 2,
                y: 11,
                type: "laser",
                requires: [
                    "btn_tl",
                    "btn_bl"
                ],
                logic: "AND"
            },
            {
                id: "laser_tr",
                x: 12,
                y: 11,
                type: "laser",
                requires: [
                    "btn_tr",
                    "btn_br"
                ],
                logic: "AND"
            }
        ]
    }
]);
