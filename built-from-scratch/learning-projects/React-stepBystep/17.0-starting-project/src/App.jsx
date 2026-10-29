import AfterSubmit from "./components/AfterSubmit.jsx";
import CartModal from "./components/CartModal";
import Checkout from "./components/Checkout.jsx";
import Header from "./components/Header";
import Meals from "./components/Meals";
import OrderContext from "./order-context.jsx";

function App() {
  return (
    <OrderContext>
      <Header />
      <main>
        <Meals />
        <CartModal />
        <Checkout />
        <AfterSubmit />
      </main>
    </OrderContext>
  );
}

export default App;
