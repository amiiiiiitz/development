import { createContext, useReducer } from "react";

const CartContext = createContext({
  items: [],
  addItem: () => {},
  removeItem: () => {},
	clearCart: () => {}
});

function cartReducer(state, action) {
  if (action.type === "ADD-ITEM") {
    const existingCartItemIndex = state.items.findIndex(
      (item) => item.id === action.item.id
    );

		const updatedItems = [...state.items];

		if(existingCartItemIndex > -1) {
			const existingItem = state.items[existingCartItemIndex];
			const updatedItem = {
				...existingItem,
				quantity: existingItem.quantity  + 1
			}
			updatedItems[existingCartItemIndex] = updatedItem;
		}else {
			updatedItems.push({...action.item, quantity : 1});
		}

		return {...state, items: updatedItems}
  }

  if (action.type === "REMOVE-ITEM") {
		const existingCartItemIndex = state.items.findIndex(
      (item) => item.id === action.id
    );

		const existingCartItem = state.items[existingCartItemIndex];
		const updatedItems = [...state.items];

		if(existingCartItem.quantity === 1) {
			updatedItems.splice(existingCartItemIndex, 1);
		}else {
			const updatedItem = {
				...existingCartItem,
				quantity: existingCartItem.quantity - 1
			}
			updatedItems[existingCartItemIndex] = updatedItem; 
		}

		return {...state, items: updatedItems}
  }

	if(action.type === 'CLEAR-CART') {
		return {...state, items: []};
	}
  return state;
}

export function CartContextProvider({ children }) {
  const [cart, dispatchAction] = useReducer(cartReducer, { items: [] });

	function addItem(item) {
		dispatchAction({ type: 'ADD-ITEM', item });
	}
	function removeItem(id) {
		dispatchAction({ type: 'REMOVE-ITEM', id });
	}
	function clearCart(id) {
		dispatchAction({ type: 'CLEAR-CART'});
	}

	const cartContext = {
		items: cart.items,
		addItem,
		removeItem,
		clearCart
	}

  return <CartContext.Provider value={cartContext}>{children}</CartContext.Provider>;
}

export default CartContext;
