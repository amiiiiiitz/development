import { useContext, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { OrderStateContext } from "../order-context.jsx";

export default function AfterSubmit() {
  const { submitModalIsOpen, closeSubmit } = useContext(OrderStateContext);
  const dialog = useRef();

  useEffect(() => {
    if (!dialog.current) return;
    submitModalIsOpen ? dialog.current.showModal() : dialog.current.close();
  }, [submitModalIsOpen]);

  return createPortal(
    <dialog className="modal" ref={dialog}>
      <h2>Order Submitted</h2>
      <p>Thank you. Your order was submitted successfully.</p>
      <p className="modal-actions">
        <button type="button" className="button" onClick={closeSubmit}>
          Okay
        </button>
      </p>
    </dialog>,
    document.getElementById("modal")
  );
}
