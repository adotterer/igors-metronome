"use client"

import { useState, useEffect, useRef } from 'react'
import { beatsUntil, bpmFromTaps } from '@/lib/bpm'
import { FaPlay, FaStop, FaAngleUp, FaAngleDown } from "react-icons/fa";

// The scheduler wakes up every SCHEDULER_INTERVAL_MS and books any clicks due in the
// next LOOKAHEAD_SECONDS on the audio clock. setInterval can fire late, but as long as
// it's late by less than the lookahead, the clicks still play exactly on time.
const SCHEDULER_INTERVAL_MS = 25
const LOOKAHEAD_SECONDS = 0.1

function playClick(ctx: AudioContext, buffer: AudioBuffer, time: number): AudioBufferSourceNode {
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(time)
    return source
}

export default function Metronome() {
    const [bpm, setBPM] = useState(60)
    const [active, setActive] = useState(false)
    const [pulseClass, setPulseClass] = useState("")
    const ctxRef = useRef<AudioContext | null>(null)
    const bufferRef = useRef<AudioBuffer | null>(null)
    const taps = useRef<number[]>([])

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
        if (!active || !ctx || !buffer) return

        const sources = new Set<AudioBufferSourceNode>()
        const flashTimeouts = new Set<ReturnType<typeof setTimeout>>()
        const later = (fn: () => void, ms: number) => {
            const t = setTimeout(() => {
                flashTimeouts.delete(t)
                fn()
            }, ms)
            flashTimeouts.add(t)
        }

        let nextBeat = ctx.currentTime + 0.05
        const schedule = () => {
            const result = beatsUntil(nextBeat, ctx.currentTime + LOOKAHEAD_SECONDS, bpm)
            nextBeat = result.nextBeat
            for (const time of result.times) {
                const source = playClick(ctx, buffer, time)
                sources.add(source)
                source.onended = () => sources.delete(source)
                // Line the flash up with when the click actually sounds
                later(() => {
                    setPulseClass("bg-fuchsia-500")
                    later(() => setPulseClass("bg-transparent"), 100)
                }, Math.max(0, (time - ctx.currentTime) * 1000))
            }
        }

        schedule()
        const id = setInterval(schedule, SCHEDULER_INTERVAL_MS)

        return () => {
            clearInterval(id)
            flashTimeouts.forEach(clearTimeout)
            // Silence clicks that were booked ahead but haven't played yet
            sources.forEach((s) => s.stop())
            setPulseClass("bg-transparent")
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
        <div className={"cursor-pointer w-[100px] h-[100px] border-1 rounded-full flex justify-center items-center " + pulseClass}
            onClick={togglePlay}>
            {active ? <FaStop /> : <FaPlay />}
        </div>
        <div>
            <button className="p-5 rounded-full border-1" onClick={calculateBPM}>TAP</button>
        </div>
    </div>
}