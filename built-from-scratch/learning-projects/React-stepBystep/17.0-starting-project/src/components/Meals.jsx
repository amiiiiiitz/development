import { useContext, useEffect, useState } from "react";
import { fetchAvailableMeals } from "../http.js";
import { OrderStateContext } from "../order-context.jsx";

export default function Meals() {
  const { handleOrder } = useContext(OrderStateContext);
  const [availableMeals, setAvailableMeals] = useState([]);
  const [error, setError] = useState();
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    async function loadMeals() {
      try {
        const meals = await fetchAvailableMeals();
        setAvailableMeals(meals);
      } catch (error) {
        setError(error.message || "Failed to fetch meals data");
      }
      setIsFetching(false);
    }
    loadMeals();
  }, []);

  if (isFetching) return <p className="center">Loading meals...</p>;
  if (error)
    return (
      <div className="error">
        <h2>{error}</h2>
        <p>Something went wrong.</p>
      </div>
    );

  return (
    <ul id="meals">
      {availableMeals.map((meal) => (
        <li className="meal-item" key={meal.id}>
          <article>
            <img src={`http://localhost:3000/${meal.image}`} alt={meal.name} />
            <div>
              <h3>{meal.name}</h3>
              <p className="meal-item-description">{meal.description}</p>
              <p className="meal-item-price">${meal.price}</p>
            </div>
            <p className="meal-item-actions">
              <button className="button" onClick={() => handleOrder(meal)}>
                Add to Cart
              </button>
            </p>
          </article>
        </li>
      ))}
    </ul>
  );
}
