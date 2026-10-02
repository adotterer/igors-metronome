"use client"

import { useState, useEffect, useRef } from 'react'
import { beatsUntil, bpmFromTaps } from '@/lib/bpm'
import { FaPlay, FaStop, FaAngleUp, FaAngleDown } from "react-icons/fa";

// The scheduler wakes up every SCHEDULER_INTERVAL_MS and books any clicks due in the
// next LOOKAHEAD_SECONDS on the audio clock. setInterval can fire late, but as long as
// it's late by less than the lookahead, the clicks still play exactly on time.
const SCHEDULER_INTERVAL_MS = 25
const LOOKAHEAD_SECONDS = 0.1
const FLASH_CLASS = "bg-fuchsia-500"
const FLASH_MS = 100

function playClick(ctx: AudioContext, buffer: AudioBuffer, time: number): AudioBufferSourceNode {
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(time)
    return source
}

// Converts a time on the AudioContext clock into the performance.now() time when that
// click actually comes out of the speakers. Sound reaches the speakers a bit after
// the audio clock says it plays (much later for Bluetooth headphones).
function heardAt(ctx: AudioContext, time: number): number {
    const ts = ctx.getOutputTimestamp()
    if (ts.contextTime !== undefined && ts.performanceTime) {
        return ts.performanceTime + (time - ts.contextTime) * 1000
    }
    // Browsers without output timestamps: estimate from the reported latency
    return performance.now() + (time - ctx.currentTime + ctx.baseLatency + (ctx.outputLatency ?? 0)) * 1000
}

export default function Metronome() {
    const [bpm, setBPM] = useState(60)
    const [active, setActive] = useState(false)
    const ctxRef = useRef<AudioContext | null>(null)
    const bufferRef = useRef<AudioBuffer | null>(null)
    const taps = useRef<number[]>([])
    const circleRef = useRef<HTMLDivElement>(null)

    // Browsers only let audio start from a user gesture, so call this from click handlers.
    // Loads and decodes the click once, so every beat after that plays with no delay.
    async function ensureAudio() {
        if (!ctxRef.current) {
            ctxRef.current = new AudioContext()
        }
        const ctx = ctxRef.current
        if (ctx.state === "suspended") {
            await ctx.resume()
        }
        if (!bufferRef.current) {
            const res = await fetch("/click.mp3")
            bufferRef.current = await ctx.decodeAudioData(await res.arrayBuffer())
        }
        return { ctx, buffer: bufferRef.current }
    }

    async function playSound() {
        try {
            const { ctx, buffer } = await ensureAudio()
            playClick(ctx, buffer, ctx.currentTime)
        } catch (er) {
            console.error("Audio playback failed:", er)
        }
    }

    async function togglePlay() {
        if (active) {
            setActive(false)
            return
        }
        try {
            await ensureAudio()
            setActive(true)
        } catch (er) {
            console.error("Audio playback failed:", er)
        }
    }

    function calculateBPM() {
        playSound()
        taps.current = [...taps.current, performance.now()].slice(-5)
        const tappedBPM = bpmFromTaps(taps.current)
        if (tappedBPM) setBPM(tappedBPM)
    }

    useEffect(() => {
        const ctx = ctxRef.current
        const buffer = bufferRef.current
        const circle = circleRef.current
        if (!active || !ctx || !buffer || !circle) return

        const sources = new Set<AudioBufferSourceNode>()
        // performance.now() times when each upcoming click will be heard
        const flashes: number[] = []

        let nextBeat = ctx.currentTime + 0.05
        const schedule = () => {
            const result = beatsUntil(nextBeat, ctx.currentTime + LOOKAHEAD_SECONDS, bpm)
            nextBeat = result.nextBeat
            for (const time of result.times) {
                const source = playClick(ctx, buffer, time)
                sources.add(source)
                source.onended = () => sources.delete(source)
                flashes.push(heardAt(ctx, time))
            }
        }

        schedule()
        const id = setInterval(schedule, SCHEDULER_INTERVAL_MS)

        // Flash on animation frames rather than timers, so it's tied to when the screen
        // actually updates. Toggling the class directly skips a React re-render.
        let lastFrame = performance.now()
        let flashOffAt = 0
        let raf = 0
        const frame = (now: number) => {
            const frameMs = Math.min(now - lastFrame, 50)
            lastFrame = now
            // This frame is shown about one frame from now, so light up the frame
            // whose display time lands closest to when the click is heard.
            let due = false
            while (flashes.length && flashes[0] < now + frameMs * 1.5) {
                flashes.shift()
                due = true
            }
            if (due) {
                circle.classList.add(FLASH_CLASS)
                flashOffAt = now + FLASH_MS
            } else if (flashOffAt && now >= flashOffAt) {
                circle.classList.remove(FLASH_CLASS)
                flashOffAt = 0
            }
            raf = requestAnimationFrame(frame)
        }
        raf = requestAnimationFrame(frame)

        return () => {
            clearInterval(id)
            cancelAnimationFrame(raf)
            sources.forEach((s) => s.stop())
            circle.classList.remove(FLASH_CLASS)
        }
    }, [active, bpm])

    return <div className="p-4 align-center flex flex-col border items-center gap-6">
        <div className="flex gap-4 items-center">
            <button onClick={() => {
                setActive(false)
                setBPM(bpm - 1)
            }
            }><FaAngleDown /></button>
            <input
                value={bpm}
                name="bpm"
                type="number"
                placeholder="BPM"
                className="flex justify-center items-center text-center"
                onChange={(e) => {
                    setActive(false)
                    setBPM(Number(e.currentTarget.value))
                }}>
            </input>
            <label htmlFor='bpm'>BPM</label>
            <button onClick={() => {
                setActive(false)
                setBPM(bpm + 1)
            }}><FaAngleUp /></button>
        </div>
        <div ref={circleRef} className="cursor-pointer w-[100px] h-[100px] border-1 rounded-full flex justify-center items-center"
            onClick={togglePlay}>
            {active ? <FaStop /> : <FaPlay />}
        </div>
        <div>
            <button className="p-5 rounded-full border-1" onClick={calculateBPM}>TAP</button>
        </div>
    </div>
}