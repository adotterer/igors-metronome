import Metronome from "@/components/Metronome";

export default function Home() {
  return (
    <div className="flex w-full h-full">
      <main className="flex items-center justify-center border w-full h-[500px]">
       <Metronome />
      </main>
    </div>
  );
}
