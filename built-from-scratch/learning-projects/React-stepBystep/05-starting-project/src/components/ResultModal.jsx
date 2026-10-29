// next 2 comments are used for timer challenge comment-1
// export default function Result ({ref, result, targetTime}) {
   
//     return (
//         <dialog ref = {ref} className="result-modal">
//             <h2>You {result}!</h2>
//             <p>The target time was <strong>{targetTime}</strong> seconds.</p>
//             <p>You stopped the timer with <strong>X  seconds left.</strong></p>
//             <form method = "dialog">
//                 <button>Close</button>
//             </form>
//         </dialog>
//     );
// }

// import { forwardRef } from "react";

// const Result = forwardRef(function Result({ result, targetTime },ref) {
//   return (
//     <dialog ref={ref} className="result-modal">
//       <h2>You {result}!</h2>
//       <p>
//         The target time was <strong>{targetTime}</strong> seconds.
//       </p>
//       <p>
//         You stopped the timer with <strong>X seconds left.</strong>
//       </p>
//       <form method="dialog">
//         <button>Close</button>
//       </form>
//     </dialog>
//   );
// });

// export default Result;

import { useImperativeHandle, useRef } from "react"; 
import { createPortal } from "react-dom";

export default function Result ({ref, remainingTime, targetTime, onReset}) {
    const dialog = useRef();
    const userLost = remainingTime <= 0;
    const formattedRemainingtime = (remainingTime / 1000).toFixed(2);
    const score = Math.round((1 - remainingTime / (targetTime * 1000)) * 100);
    
    useImperativeHandle(ref, () => {
        return {
            open() {
                dialog.current.showModal();
            }
        };
    });
    return createPortal(
        <dialog ref = {dialog} className="result-modal">
            <h2>You {userLost ? 'lost!' : `win! and score is ${score}`}</h2>
            <p>The target time was <strong>{targetTime}</strong> seconds.</p>
            <p>You stopped the timer with <strong>{formattedRemainingtime}seconds left.</strong></p>
            <form method = "dialog" onSubmit = {onReset}>
                <button>Close</button>
            </form>
        </dialog>,
        document.getElementById('modal')
    );
}