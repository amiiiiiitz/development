import { Link, useParams } from "react-router-dom";

function ProductDetailsPage() {
	const params = useParams(); // useParams is a hook provided by react-router-dom that allows us to access the dynamic segments of the URL. it returns an object with the dynamic segments as keys and their values as values. so in this case it will return { productId: "1" } when we visit /products/1 and { productId: "2" } when we visit /products/2. we can use this dynamic segment to fetch the details of the product from the server and display it on the page.
	return (
		<div>
			<h1>Product Details</h1>
			<p>This is the product details page for product ID: {params.productId}</p>
			<p><Link to=".." relative="path">Back to Products</Link></p> 
			{/* this .. goes back the current page to its parent route. with relative = path we are removing this default behavior and telling that go back to previous url ( relative has two value route and path, by default it is route) */}
		</div>
	);
}

export default ProductDetailsPage;