"use client"

import { useState, useEffect, useRef } from 'react'
import { createBPMInterval } from '@/lib/bpm'
import { FaPlay, FaStop, FaAngleUp, FaAngleDown } from "react-icons/fa";

export default function Metronome() {
    const [bpm, setBPM] = useState(60)
    const [active, setActive] = useState(false)
    const [pulseClass, setPulseClass] = useState("")
    const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | undefined>()
    const audioRef = useRef<HTMLAudioElement | null>(null)
    function playSound() {
        if (!audioRef.current) {
            audioRef.current = new Audio("/click.mp3")
        }
        audioRef.current.currentTime = 0
        audioRef.current.play().catch((er) => console.error("Audio playback failed:", er))

    }
    function flash() {
        playSound()
        setPulseClass("bg-fuchsia-500")
        setTimeout(() => setPulseClass("bg-transparent"), 100)
    }

    useEffect(() => {
        if (active) {
            flash()
            const int = createBPMInterval(flash, bpm)
            setIntervalId(int)
        }
    }, [bpm, active])

    useEffect(() => {
        if (!active) {
            clearInterval(intervalId)
        }
    }, [active, intervalId])

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
            }
            }><FaAngleUp /></button>
        </div>
        <div className={"cursor-pointer w-[100px] h-[100px] border-1 rounded-full flex justify-center items-center " + pulseClass}
            onClick={() => setActive(c => !c)}>
            {active ? <FaStop /> : <FaPlay />}
        </div>
    </div>
}