import { createContext, useReducer } from "react";
import { DUMMY_PRODUCTS } from "../dummy-products.js";

export const CartContext = createContext({
    items: [],
    addItemToCart: () => {},
    updateItemQuantity: () => {},
});

function shoppingCartReducer(state, action) {
    //declaring it here as we dont want to give it all accesses in context function, here 1st parameter is the latest state provide by reducer and 2nd parameter is the actions performed by dispatch

    if (action.type === "ADD-ITEM") {
        const updatedItems = [...state.items];

        const existingCartItemIndex = updatedItems.findIndex(
            (cartItem) => cartItem.id === action.payload,
        );
        const existingCartItem = updatedItems[existingCartItemIndex];

        if (existingCartItem) {
            const updatedItem = {
                ...existingCartItem,
                quantity: existingCartItem.quantity + 1,
            };
            updatedItems[existingCartItemIndex] = updatedItem;
        } else {
            const product = DUMMY_PRODUCTS.find(
                (product) => product.id === action.payload,
            );
            updatedItems.push({
                id: action.payload,
                name: product.title,
                price: product.price,
                quantity: 1,
            });
        }

        return {
            ...state, // not needed here as there's only one value
            items: updatedItems,
        };
    }

    if (action.type === "UPDATE-ITEM") {
        const updatedItems = [...state.items];

        const updatedItemIndex = updatedItems.findIndex(
            (item) => item.id === action.payload.productId,
        );

        const updatedItem = {
            ...updatedItems[updatedItemIndex],
        };

        updatedItem.quantity += action.payload.amount;

        if (updatedItem.quantity <= 0) {
            updatedItems.splice(updatedItemIndex, 1);
        } else {
            updatedItems[updatedItemIndex] = updatedItem;
        }

        return {
            items: updatedItems,
        };
    }

    return state;
}

export default function CartContextProvider({ children }) {
    const [shoppingCartState, shoppingCartDispatch] = useReducer(
        shoppingCartReducer,
        {
            items: [],
        },
        // 2nd parameter of useReducer is the initial value for state on the shoppingCartReducer function
    );

    function handleAddItemToCart(id) {
        shoppingCartDispatch({
            type: "ADD-ITEM",
            payload: id,
        });
    }

    function handleUpdateCartItemQuantity(productId, amount) {
        shoppingCartDispatch({
            type: "UPDATE-ITEM",
            payload: {
                //    productId: productId,
                //    amount: amount // we can do it separately without payload as well
                productId,
                amount, // both is same as property name and variable name is not diff
            },
        });
    }

    const ctxValue = {
        items: shoppingCartState.items,
        addItemToCart: handleAddItemToCart,
        updateItemQuantity: handleUpdateCartItemQuantity,
    };

    return (
        <CartContext.Provider value={ctxValue}>
            {/* here we dont need to use provider if the react verson is greater equal 19 */}
            {children}
        </CartContext.Provider>
    );
}
