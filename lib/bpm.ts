// make a function that takes BPM and makes the approriate set Interval timing in milliseconds

export function translateToMilliseconds(bpm: number): number {
    const milliseconds = (bpm / 60) * 1000
    return milliseconds
}

export function createBPMInterval(func: () => any, bpm: number): ReturnType<typeof setInterval> {
    const milliseconds = translateToMilliseconds(bpm)

    return setInterval(func, milliseconds)
}