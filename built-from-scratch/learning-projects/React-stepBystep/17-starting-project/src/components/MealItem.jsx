import { useContext } from "react"
import { currecnyFormatter } from "../util/formatter.js"
import CartContext from "../store/CartContext.jsx";
import Button from "./UI/Button.jsx";

export default function MealItem({ meal }) {
	const cartCtx = useContext(CartContext);
	function handleAddMealToCart() {
		cartCtx.addItem(meal);
	}
	return <li className="meal-item">
		<article>
			<img src={`http://localhost:3000/${meal.image}`} />
			<div>
				<h3>{meal.name}</h3>
				<p className="meal-item-price">{currecnyFormatter.format(meal.price)}</p>
				<p className="mela-item-description">{meal.description}</p>
			</div>
			<p className="meal-item-actions">
				<Button onClick = {handleAddMealToCart}>Add to Cart</Button>
			</p>
		</article>
	</li>
}