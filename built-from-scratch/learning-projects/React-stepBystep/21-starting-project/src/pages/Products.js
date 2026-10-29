import { Link } from "react-router-dom";

const PRODUCTS = [
  {
    id: "product-1",
    name: "Product 1",
    description: "This is Product 1",
  },
  {
    id: "product-2",
    name: "Product 2",
    description: "This is Product 2",
  },
  {
    id: "product-3",
    name: "Product 3",
    description: "This is Product 3",
  },
];

function ProductsPage() {
  return (
    <>
      <h1>Products Page</h1>
      <ul>
        {PRODUCTS.map((product) => (
          <li key={product.id}>
            <Link to={product.id} >{product.name}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default ProductsPage;
