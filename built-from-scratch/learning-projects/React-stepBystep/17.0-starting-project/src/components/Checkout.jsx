import { useContext, useEffect, useRef } from "react";
import { OrderStateContext } from "../order-context.jsx";
import { createPortal } from "react-dom";
import Form from "./Form.jsx";

export default function Checkout() {
  const { updatedOrder, checkoutModalIsOpen, closeCheckout } =
    useContext(OrderStateContext);

  const dialog = useRef();
  const totalAmount = updatedOrder.items.reduce(
    (sum, item) => sum + item.price * item.count,
    0
  );

  useEffect(() => {
    if (!dialog.current) return;
    checkoutModalIsOpen
      ? dialog.current.showModal()
      : dialog.current.close();
  }, [checkoutModalIsOpen]);

  return createPortal(
    <dialog className="modal" ref={dialog}>
      <button className="button" onClick={closeCheckout}>
        Close
      </button>
      <h2>Checkout</h2>
      <p>{`Total Amount: $${totalAmount.toFixed(2)}`}</p>
      <Form />
    </dialog>,
    document.getElementById("modal")
  );
}
