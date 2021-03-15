export const LogTimer = {
    properties: {
        startTime: 0,
        startTick: 0,
        timeSinceLastLog: 0,
        ticksSinceLastLog: 0
    },
};
export const LogValues = {
    multiset: true,
    properties: {
        value: "",
    },
};
export const LogOptions = {
    properties: {
        oneTime: false,
        interval: 1000,
        intervalUnits: "ms",
        filter: null
    },
};
