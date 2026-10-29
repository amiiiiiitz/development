import { useContext } from "react";
import titleImg from "../assets/logo.jpg";
import { OrderStateContext } from "../order-context.jsx";

export default function Header() {
  const { updatedOrder, openCart } = useContext(OrderStateContext);
  const orderCount = updatedOrder.items.reduce(
    (total, item) => total + item.count,
    0
  );

  return (
    <header id="main-header">
      <div id="title">
        <img src={titleImg} alt="food logo picture" />
        <h1>hungry.hunt</h1>
      </div>

      <button className="text-button" onClick={openCart}>
        Orders ({orderCount})
      </button>
    </header>
  );
}
