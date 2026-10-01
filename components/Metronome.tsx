"use client"

import { useState } from 'react'

/* 

Play button

way to set BPM 
Way to keep track of BPM

visualization of the BPM 


*/

export default function Metronome() {
    const [bpm, setBPM] = useState(60)
    return <div className="p-4 align-center flex flex-col">
        <div className="flex gap-4">
        <button onClick={() => setBPM(bpm - 1)}>DOWN</button>
        <input
            value={bpm}
            name="bpm"
            type="number"
            placeholder="BPM"

            onChange={(e) => setBPM(Number(e.currentTarget.value))}>
        </input>
        <label htmlFor='bpm'>BPM</label>
        <button onClick={() => setBPM(bpm + 1)}>UP</button>
        </div>


    </div>
}