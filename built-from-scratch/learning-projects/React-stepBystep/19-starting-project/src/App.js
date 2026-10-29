import { Fragment } from "react/jsx-runtime";
import Counter from "./components/Counter";
import Header from "./components/Header";
import Auth from "./components/Auth";
import { useSelector } from "react-redux";

function App() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return (
    <Fragment>
      // Fragment is a component that allows us to group multiple elements
      without adding an extra node to the DOM. it is useful when we want to
      return multiple elements from a component without wrapping them in a div
      or any other container. in this case, we are using Fragment to wrap the
      Header, Auth, and Counter components without adding an extra div to the
      DOM. this helps to keep our DOM structure clean and avoids unnecessary
      nesting of elements.
      {isAuthenticated && <Header />}
      {!isAuthenticated && <Auth />}
      {isAuthenticated && <Counter />}
    </Fragment>
  );
}

export default App;
