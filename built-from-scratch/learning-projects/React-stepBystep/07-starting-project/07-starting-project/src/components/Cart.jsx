import { useContext } from "react";
import { CartContext } from "../store/shopping-cart-context";

export default function Cart() {
    const { items, updateItemQuantity } = useContext(CartContext); // instead of this we can also use , use which we can declare inside a if else or loops but usecontext is not valid for this but use is only available on react 19 or upper.... {items} er jagay ekta variable declare kore kora jay then we need to do it like these variable.ietms instead of items

    const totalPrice = items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0,
    );
    const formattedTotalPrice = `$${totalPrice.toFixed(2)}`;

    return (
        <div id="cart">
            {items.length === 0 && <p>No items in cart!</p>}
            {items.length > 0 && (
                <ul id="cart-items">
                    {items.map((item) => {
                        const formattedPrice = `$${item.price.toFixed(2)}`;

                        return (
                            <li key={item.id}>
                                <div>
                                    <span>{item.name}</span>
                                    <span> ({formattedPrice})</span>
                                </div>
                                <div className="cart-item-actions">
                                    <button
                                        onClick={() =>
                                            updateItemQuantity(item.id, -1)
                                        }
                                    >
                                        -
                                    </button>
                                    <span>{item.quantity}</span>
                                    <button
                                        onClick={() =>
                                            updateItemQuantity(item.id, 1)
                                        }
                                    >
                                        +
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
            <p id="cart-total-price">
                Cart Total: <strong>{formattedTotalPrice}</strong>
            </p>
        </div>
    );
}
