"use strict";
export const DEBUG_MODE = false;

export class Logger {
    static log(message) {
        if (DEBUG_MODE) {
            console.log(`[VODDKIN LOG]: ${message}`);
        }
    }

    static error(message) {
        if (DEBUG_MODE) {
            console.error(`[VODDKIN ERROR]: ${message}`);
        }
    }
}
