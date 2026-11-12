import React, { useState } from "react";
import { Quote } from "lucide-react";

const MEMORY_MESSAGES = [
  "Some songs don't take you back. They remind you that you never really left.",
  "Funny how a few seconds of sound can bring back an entire lifetime.",
  "This one belongs to a version of me I'll never meet again.",
  "Not every memory needs a photograph. Sometimes there's a song.",
  "A little nostalgia, on repeat.",
  "Somewhere between the lyrics and the silence, there's a memory.",
];

export default function MemoryQuote() {
  // Lazy initializer: runs once, so no flash of message #0 before the random one.
  const [message] = useState(
    () => MEMORY_MESSAGES[Math.floor(Math.random() * MEMORY_MESSAGES.length)]
  );

  return (
    <section className="rx-memory-quote bg-[#0f0f0e] text-[#d9d8d1] rounded-lg p-6 md:p-8 pb-12 relative overflow-hidden min-h-[200px] max-w-[360px] w-full">
      <div className="flex flex-col items-start gap-4 min-w-0">
        {/* In normal flow now, so the text sits below it */}
        <Quote
          size={22}
          className="rx-quote-icon shrink-0 text-[#d9a226] opacity-70"
          aria-hidden="true"
        />

        <p className="rx-quote-text text-lg leading-relaxed font-medium">
          {message}
        </p>

        <div className="rx-metadata text-xs tracking-widest opacity-60">
          <span>A NOTE FROM THE MUSIC</span>
        </div>
      </div>

      {/* Tape label: moved inside the card so overflow-hidden cannot clip it */}
      <div className="absolute bottom-3 right-3 bg-[#d9a226] text-[#0f0f0e] rounded text-xs font-bold px-2 py-0.5 opacity-80 rotate-6">
        MEMORY
      </div>
    </section>
  );
}