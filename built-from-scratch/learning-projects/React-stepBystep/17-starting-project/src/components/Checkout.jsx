// import { useContext } from "react";
// import Modal from "./UI/Modal.jsx";
// import CartContext from "../store/CartContext.jsx";
// import { currecnyFormatter } from "../util/formatter.js";
// import Input from "./UI/Input.jsx";
// import Button from "./UI/Button.jsx";
// import UserProgressContext from "../store/UserProgressContext.jsx";
// import useHttp from "../hooks/useHttp.js";
// import Error from "./Error.jsx";

// const reqConfig = {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//   },
// };

// export default function Checkout() {
//   const cartCtx = useContext(CartContext);
//   const userProgressCtx = useContext(UserProgressContext);

//   const {
//     data,
//     isLoading: isSending,
//     error,
//     sendReq,
// 		clearData
//   } = useHttp("http://localhost:3000/orders", reqConfig);

//   const cartTotal = cartCtx.items.reduce((totalPrice, item) => {
//     return totalPrice + item.quantity * item.price;
//   }, 0);

//   function handleClose() {
//     userProgressCtx.hideCheckout();
//   }

// 	function handleFinish() {
// 		userProgressCtx.hideCheckout();
// 		cartCtx.clearCart();
// 		clearData();
// 	}
//   function handleSubmit(event) {
//     event.preventDefault();

//     const fd = new FormData(event.target);
//     const customerData = Object.fromEntries(fd.entries());

//     sendReq(
//       JSON.stringify({
//         order: {
//           items: cartCtx.items,
//           customer: customerData,
//         },
//       }),
//     );
//   }

//   let action = (
//     <>
//       <Button type="button" textOnly onClick={handleClose}>
//         Close
//       </Button>
//       <Button>Submit Order</Button>
//     </>
//   );

//   if (isSending) {
//     action = <span>Sending order data...</span>;
//   }

//   if (data && !error) {
//     return (
//       <Modal
//         open={userProgressCtx.progress === "checkout"}
//         onClose={handleFinish}
//       >
//         <h2>Success!</h2>
//         <p>Your order submitted successfully..</p>
//         <p>we will get back to you via email within few miniutes</p>
//         <p className="modal-actions">
//           <Button onClick={handleFinish}>Okayyy</Button>
//         </p>
//       </Modal>
//     );
//   }
//   return (
//     <Modal
//       open={userProgressCtx.progress === "checkout"}
//       onClose={handleClose}
//     >
//       <form onSubmit={handleSubmit}>
//         <h2>Checkout</h2>
//         <p>Total amount: {currecnyFormatter.format(cartTotal)}</p>

//         <Input label="Full Name" type="text" id="name" />
//         <Input label="E-mail" type="email" id="email" />
//         <Input label="Street" type="text" id="street" />

//         <div className="control-row">
//           <Input label="Postal code" type="text" id="postal-code" />
//           <Input label="City" type="text" id="city" />
//         </div>

//         {error && <Error title="Failed to submit order" message={error} />}
//         <p className="modal-actions">{action}</p>
//       </form>
//     </Modal>
//   );
// }

// handling with form actioins
import { useContext } from "react";
import Modal from "./UI/Modal.jsx";
import CartContext from "../store/CartContext.jsx";
import { currecnyFormatter } from "../util/formatter.js";
import Input from "./UI/Input.jsx";
import Button from "./UI/Button.jsx";
import UserProgressContext from "../store/UserProgressContext.jsx";
import useHttp from "../hooks/useHttp.js";
import Error from "./Error.jsx";
import { useActionState } from "react";

const reqConfig = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
};

export default function Checkout() {
  const cartCtx = useContext(CartContext);
  const userProgressCtx = useContext(UserProgressContext);

  const {
    data,
    error,
    sendReq,
    clearData,
  } = useHttp("http://localhost:3000/orders", reqConfig);

  const cartTotal = cartCtx.items.reduce((totalPrice, item) => {
    return totalPrice + item.quantity * item.price;
  }, 0);

  function handleClose() {
    userProgressCtx.hideCheckout();
  }

  function handleFinish() {
    userProgressCtx.hideCheckout();
    cartCtx.clearCart();
    clearData();
  }

  async function checkoutActions(prevState, fd) {
    const customerData = Object.fromEntries(fd.entries());

    await sendReq(
      JSON.stringify({
        order: {
          items: cartCtx.items,
          customer: customerData,
        },
      }),
    );
  }

	const [formState, formAction, pending ] = useActionState(checkoutActions, null)
  let action = (
    <>
      <Button type="button" textOnly onClick={handleClose}>
        Close
      </Button>
      <Button>Submit Order</Button>
    </>
  );

  if (pending) {
    action = <span>Sending order data...</span>;
  }

  if (data && !error) {
    return (
      <Modal
        open={userProgressCtx.progress === "checkout"}
        onClose={handleFinish}
      >
        <h2>Success!</h2>
        <p>Your order submitted successfully..</p>
        <p>we will get back to you via email within few miniutes</p>
        <p className="modal-actions">
          <Button onClick={handleFinish}>Okayyy</Button>
        </p>
      </Modal>
    );
  }
  return (
    <Modal open={userProgressCtx.progress === "checkout"} onClose={handleClose}>
      <form action={formAction}>
        <h2>Checkout</h2>
        <p>Total amount: {currecnyFormatter.format(cartTotal)}</p>

        <Input label="Full Name" type="text" id="name" />
        <Input label="E-mail" type="email" id="email" />
        <Input label="Street" type="text" id="street" />

        <div className="control-row">
          <Input label="Postal code" type="text" id="postal-code" />
          <Input label="City" type="text" id="city" />
        </div>

        {error && <Error title="Failed to submit order" message={error} />}
        <p className="modal-actions">{action}</p>
      </form>
    </Modal>
  );
}
