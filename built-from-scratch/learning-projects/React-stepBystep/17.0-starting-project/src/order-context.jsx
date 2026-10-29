import { createContext, useState } from "react";

export const OrderStateContext = createContext({
  updatedOrder: { items: [], customer: {} },
  handleOrder: () => {},

  modalIsOpen: false,
  openCart: () => {},
  closeCart: () => {},

  checkoutModalIsOpen: false,
  openCheckout: () => {},
  closeCheckout: () => {},

  submitModalIsOpen: false,
  openSubmit: () => {},
  closeSubmit: () => {},
});

export default function OrderContext({ children }) {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [checkoutModalIsOpen, setCheckoutModalIsOpen] = useState(false);
  const [submitModalIsOpen, setSubmitModalIsOpen] = useState(false);

  const [updatedOrder, setupdatedOrder] = useState({
    items: [],
    customer: {
      name: "",
      email: "",
      phone: "",
      street: "",
      "postal-code": "",
      city: "",
    },
  });

  function handleOrder(meal, action = 1) {
    setupdatedOrder((prevOrder) => {
      const existingOrderIndex = prevOrder.items.findIndex(
        (order) => order.id === meal.id
      );

      if (existingOrderIndex === -1) {
        if (action < 1) return prevOrder;
        return { ...prevOrder, items: [...prevOrder.items, { ...meal, count: 1 }] };
      }

      const updatedCount = prevOrder.items[existingOrderIndex].count + action;

      if (updatedCount < 1) {
        return {
          ...prevOrder,
          items: prevOrder.items.filter((order) => order.id !== meal.id),
        };
      }

      return {
        ...prevOrder,
        items: prevOrder.items.map((order) =>
          order.id === meal.id ? { ...order, count: updatedCount } : order
        ),
      };
    });
  }

  function handleOpenCart() {
    setModalIsOpen(true);
  }
  function handleCloseCart() {
    setModalIsOpen(false);
  }
  function handleOpenCheckout() {
    setModalIsOpen(false);
    setCheckoutModalIsOpen(true);
  }
  function handleCloseCheckout() {
    setCheckoutModalIsOpen(false);
  }
  function handleOpenSubmitModal() {
    setCheckoutModalIsOpen(false);
    setSubmitModalIsOpen(true);
  }
  function handleCloseSubmitModal() {
    setSubmitModalIsOpen(false);
  }

  const ctxValue = {
    updatedOrder,
    handleOrder,

    modalIsOpen,
    openCart: handleOpenCart,
    closeCart: handleCloseCart,

    checkoutModalIsOpen,
    openCheckout: handleOpenCheckout,
    closeCheckout: handleCloseCheckout,

    submitModalIsOpen,
    openSubmit: handleOpenSubmitModal,
    closeSubmit: handleCloseSubmitModal,
  };

  return (
    <OrderStateContext.Provider value={ctxValue}>
      {children}
    </OrderStateContext.Provider>
  );
}
