import { uiActions } from "./ui-slice";
import { cartActions } from "./cart-slice";

export const fetchCartData = () => {
  return async (dispatch) => {
    const fetchData = async () => {
      const response = await fetch(
        "https://st-project-6fa76-default-rtdb.asia-southeast1.firebasedatabase.app/cart.json",
      );
      if (!response.ok) {
        throw new Error("Could not fetch cart data!");
      }

      const data = await response.json();

      return data;
    };

    try {
      const cartData = await fetchData();
      dispatch(cartActions.replaceCart({
				items: cartData.items || [],
				totalQuantity: cartData.totalQuantity,
				// we don't need to send the changed property to the server because it's only used for client side logic and it doesn't have any meaning on the server side
				// changed: cartData.changed || false,
			}));
    } catch (error) {
      dispatch(
        uiActions.showNotification({
          status: "error",
          title: "Error!",
          message: "Fetching cart data failed!",
        }),
      );
    }
  };
};

export const sendCartData = (cart) => {
  return async (dispatch) => {
    // redux toolkit automatically provides dispatch

    dispatch(
      uiActions.showNotification({
        status: "pending",
        title: "Sending...",
        message: "Sending cart data!",
      }),
    );

    try {
      const response = await fetch(
        "https://st-project-6fa76-default-rtdb.asia-southeast1.firebasedatabase.app/cart.json",
        {
          method: "PUT", // PUT replaces existing data, POST would add new data, by using PUT we get back the exact format of the data that we send to the server but by using POST we need to transform the data into our desired format because POST returns an object with a name property that contains the generated id of the new data but PUT returns the data that we send to the server without any modification
          body: JSON.stringify({
						items: cart.items,
						totalQuantity: cart.totalQuantity,
						// we don't need to send the changed property to the server because it's only used for client side logic and it doesn't have any meaning on the server side
						// changed: cart.changed,
					}),
        },
      );

      if (!response.ok) {
        throw new Error("Sending cart data failed.");
      }

      dispatch(
        uiActions.showNotification({
          status: "success",
          title: "Success!",
          message: "Sent cart data successfully!",
        }),
      );
    } catch (error) {
      dispatch(
        uiActions.showNotification({
          status: "error",
          title: "Error!",
          message: "Sending cart data failed!",
        }),
      );
    }
  };
};
