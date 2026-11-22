import React, { useState } from "react";
import memoryBoombox from "../../photos/WhatsApp Image 2026-11-20 at 8.08.55 PM.jpeg";

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
    <section
      className="rx-memory-quote"
      style={{ "--memory-background": `url("${memoryBoombox}")` }}
    >
      <div className="rx-memory-quote__content">
        <p className="rx-quote-text">
          <span className="rx-quote-mark" aria-hidden="true">“</span>
          {message}
          <span className="rx-quote-mark" aria-hidden="true">”</span>
        </p>

        <div className="rx-metadata">
          <span>A NOTE FROM THE MUSIC</span>
        </div>
      </div>

      <div className="rx-memory-quote__label">
        MEMORY
      </div>
    </section>
  );
}

