export function secondsPerBeat(bpm: number): number {
    return 60 / bpm
}

// Collects the start time of every beat from `nextBeat` up to (not including) `horizon`,
// and returns where the beat after those lands so the scheduler can pick up from there.
// Times are in seconds on the AudioContext clock.
export function beatsUntil(nextBeat: number, horizon: number, bpm: number): { times: number[], nextBeat: number } {
    const times: number[] = []
    if (!(bpm > 0)) return { times, nextBeat }

    const step = secondsPerBeat(bpm)
    while (nextBeat < horizon) {
        times.push(nextBeat)
        nextBeat += step
    }
    return { times, nextBeat }
}

// Averages the gaps between tap timestamps (in ms) to get a tempo.
// Returns null until there are 5 taps to average.
export function bpmFromTaps(taps: number[]): number | null {
    if (taps.length < 5) return null
    const averageGap = (taps[taps.length - 1] - taps[0]) / (taps.length - 1)
    return Math.round(60000 / averageGap)
}
