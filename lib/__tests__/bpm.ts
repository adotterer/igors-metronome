import { translateToMilliseconds } from "../bpm";

describe("BPM accurately converted", () => {
    test("Expect beats per minute to be converted to milliseconds delay" , () => {
        expect(translateToMilliseconds(60)).toBe(1000)
    })
})