// comment-1
// import { useState, useRef } from "react";
// import Result from "./ResultModal";

// export default function TimerChallenge ({title, targetTime}) {
//     const dialog = useRef();
//     const timer = useRef();

//     const [timerActive, settimerActive] = useState(false);
//     const [timerExpired, setTimerExpired] = useState(false); // it has no use myb i      forgot to add the code

//     function handleStart () {
//         timer.current = setTimeout (() => {
//             setTimerExpired(true);
//             dialog.current.showModal();
//         }, 1000 * targetTime);
//         settimerActive(true);
//     }

//     function handleStop () {
//         clearTimeout(timer.current);
//     }

//     return (
//         <>
//         <Result ref = {dialog} targetTime={targetTime} result = "lost"/>
//         <section className="challenge">
//             <h2>{title}</h2>
//             <p className="challenge-time">
//                 {targetTime} second{targetTime > 1 ? 's' : ''}
//             </p>
//             <p>
//             <button onClick = {timerActive ? handleStop : handleStart}>
//                 {timerActive ? 'Stop' : 'Start'} challenge
//             </button>
//             </p>
//             <p className={timerActive ? 'active' : undefined}>
//                 {timerActive ? 'Timer running...' : 'Timer inactive'}
//             </p>
//         </section>
//         </>
//     )
// }

import { useState, useRef } from "react";
import Result from "./ResultModal";

export default function TimerChallenge({ title, targetTime }) {
  const dialog = useRef();
  const timer = useRef();

  const [timeRemaining, setTimeRemaining] = useState(targetTime * 1000);

  const timerActive = timeRemaining > 0 && timeRemaining < targetTime * 1000;

  if (timeRemaining <= 0) {
    clearInterval(timer.current);
    dialog.current.open();
  }
  function handleStart() {
    timer.current = setInterval(() => {
      setTimeRemaining((prevTimeRemaining) => prevTimeRemaining - 10);
    }, 10);
  }

  function handleStop() {
    clearInterval(timer.current);
    dialog.current.open();
  }
  function handleReset() {
    setTimeRemaining(targetTime * 1000);
  }

  return (
    <>
      <Result
        ref={dialog}
        targetTime={targetTime}
        remainingTime={timeRemaining}
        onReset={handleReset}
      />
      <section className="challenge">
        <h2>{title}</h2>
        <p className="challenge-time">
          {targetTime} second{targetTime > 1 ? "s" : ""}
        </p>
        <p>
          <button onClick={timerActive ? handleStop : handleStart}>
            {timerActive ? "Stop" : "Start"} challenge
          </button>
        </p>
        <p className={timerActive ? "active" : undefined}>
          {timerActive ? "Timer running..." : "Timer inactive"}
        </p>
      </section>
    </>
  );
}
