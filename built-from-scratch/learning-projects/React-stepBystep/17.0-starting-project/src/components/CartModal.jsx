import { useContext, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { OrderStateContext } from "../order-context.jsx";

export default function CartModal() {
  const { updatedOrder, modalIsOpen, handleOrder, closeCart, openCheckout } =
    useContext(OrderStateContext);

  const dialog = useRef();

  useEffect(() => {
    if (!dialog.current) return;
    modalIsOpen ? dialog.current.showModal() : dialog.current.close();
  }, [modalIsOpen]);

  const totalPrice = updatedOrder.items.reduce(
    (sum, item) => sum + item.price * item.count,
    0
  );

  return createPortal(
    <dialog className="modal cart" ref={dialog}>
      <h2>Your Cart</h2>
      <ul>
        {updatedOrder.items.map((item) => (
          <li className="cart-item" key={item.id}>
            <p>{`${item.name} -> ${item.count} x ${item.price}`}</p>
            <div className="cart-item-actions">
              <button onClick={() => handleOrder(item, -1)}>-</button>
              <span>{item.count}</span>
              <button onClick={() => handleOrder(item, 1)}>+</button>
            </div>
          </li>
        ))}
      </ul>
      <p className="cart-total">{`Total: $${totalPrice.toFixed(2)}`}</p>
      <p className="modal-actions">
        <button className="text-button" onClick={closeCart}>
          Close
        </button>
        <button className="button" onClick={openCheckout}>
          Checkout
        </button>
      </p>
    </dialog>,
    document.getElementById("modal")
  );
}
