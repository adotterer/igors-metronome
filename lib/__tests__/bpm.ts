import { secondsPerBeat, beatsUntil, bpmFromTaps } from "../bpm";

describe("BPM accurately converted", () => {
    test("Expect beats per minute to be converted to seconds per beat" , () => {
        expect(secondsPerBeat(60)).toBe(1)
        expect(secondsPerBeat(120)).toBe(0.5)
    })
})

describe("beatsUntil", () => {
    test("returns every beat before the horizon and the next one after", () => {
        expect(beatsUntil(0, 1.6, 120)).toEqual({ times: [0, 0.5, 1, 1.5], nextBeat: 2 })
    })

    test("returns no beats when the next beat is past the horizon", () => {
        expect(beatsUntil(2, 1.9, 120)).toEqual({ times: [], nextBeat: 2 })
    })

    test("keeps the beat grid when called repeatedly with small windows", () => {
        let nextBeat = 0
        const times: number[] = []
        for (let now = 0; now < 3; now += 0.025) {
            const result = beatsUntil(nextBeat, now + 0.1, 60)
            times.push(...result.times)
            nextBeat = result.nextBeat
        }
        expect(times).toEqual([0, 1, 2, 3])
    })

    test("schedules nothing for zero or negative BPM", () => {
        expect(beatsUntil(0, 10, 0)).toEqual({ times: [], nextBeat: 0 })
        expect(beatsUntil(0, 10, -5)).toEqual({ times: [], nextBeat: 0 })
    })
})

describe("bpmFromTaps", () => {
    test("waits for 5 taps before returning a tempo", () => {
        expect(bpmFromTaps([])).toBeNull()
        expect(bpmFromTaps([0, 500, 1000, 1500])).toBeNull()
    })

    test("averages the gaps between taps", () => {
        expect(bpmFromTaps([0, 500, 1000, 1500, 2000])).toBe(120)
        expect(bpmFromTaps([0, 900, 2100, 3000, 4000])).toBe(60)
    })
})
