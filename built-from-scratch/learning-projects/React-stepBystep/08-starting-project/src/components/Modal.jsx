import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";

function Modal({ open, children }) {
  const dialog = useRef();

  useEffect(() => {
    if (open) dialog.current.showModal();
    else dialog.current.close();
  }, [open]); // Dependencies are the values that determine when a component (or an effect) should run again—typically state and props. Refs and most other values do not trigger re-runs when they change.

  return createPortal(
    <dialog className="modal" ref={dialog}>
      {open ? children : null}
    </dialog>,
    document.getElementById("modal"),
  );
}

export default Modal;
