import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./pages/Home";
import ProductsPage from "./pages/Products";
import Roots from "./pages/Roots";
import ErrorPage from "./pages/Error";
import ProductDetailsPage from "./pages/ProductDetails";
// https://example.com/products here https is protocol, example.com is domain and products is path

const router = createBrowserRouter([
  {
    path: "/",
    element: <Roots />,
    errorElement: <ErrorPage />, // errorElement is used to render the component when there is an error in the route. it will render the component associated with the errorElement when there is an error in the route. if we try to  visit any path that doesnot occurs react dom will automatically render the errorElement component.
    children: [
      // { path: "", element: <HomePage /> },
       { index: true, element: <HomePage /> }, // index is used to tell react router that this is the default route for the parent route. it will render this component when we visit the parent route without any child route.
      { path: "products", element: <ProductsPage /> },
      { path: "products/:productId", element: <ProductDetailsPage /> }, // by adding colon before productId we are telling react router that this is a dynamic segment and it can be any value. so when we visit /products/1 then productId will be 1 and when we visit /products/2 then productId will be 2. we can access this dynamic segment in the component using useParams hook provided by react-router-dom. it will return an object with the dynamic segments as keys and their values as values. so in this case it will return { productId: "1" } when we visit /products/1 and { productId: "2" } when we visit /products/2.
    ],
  },
]);

// ===============================
// ABSOLUTE vs RELATIVE PATHS (React Router)
// ===============================

// ABSOLUTE PATH:
// - Starts with "/"
// - Treated as full URL from root (domain.com/)
// - Independent of parent path
// - Parent path is NOT appended
// - Used for standalone routes
//
// Example:
// <Route path="/products">
//   <Route path="/about" />
// </Route>
//
// Final paths:
// /products
// /about      (NOT /products/about)


// RELATIVE PATH:
// - Does NOT start with "/"
// - Dependent on parent path
// - Automatically appended to parent path
// - Used for nested routes
//
// Example:
// <Route path="/products">
//   <Route path="new" />
// </Route>
//
// Final path:
// /products/new


// KEY DIFFERENCE:
// Absolute = full independent path
// Relative = child path appended to parent


// IMPORTANT:
// Absolute → ignores parent for URL building
// Relative → uses parent for URL building


// LAYOUT NOTE:
// Both absolute and relative routes can render inside parent layout
// if parent component uses <Outlet />

/*

  1. If the parent path is "/root" and all children paths are absolute (start with '/'), 
     React Router will skip the parent completely. 
     - so the parent never renders and routes like "/root/products" cause errors.

  2. Rule for absolute children:
     - If all children are absolute, the parent should usually be "/" (root), 
       otherwise children won’t nest under it.

  3. Rule for relative children:
     - If children paths are relative (no leading '/'), they append to the parent path.
     - Parent can be "/" or any path (e.g., "/root", "/abc").
     - Example: parent "/root" + child "products" → "/root/products"
*/

function App() {
  return <RouterProvider router={router} />; // we cant wrap mainNavigation in routerProvider because it is not a child of routerprovider, so we have to wrap it in roots component and then we can use it in mainNavigation component.
}

export default App;
