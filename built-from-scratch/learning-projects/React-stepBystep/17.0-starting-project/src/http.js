export async function fetchAvailableMeals() {
  const response = await fetch('http://localhost:3000/meals');
  const resData = await response.json();

  if (!response.ok) {
    throw new Error('Failed to fetch meal data');
  }

  return resData;
}

export async function updateOrders(order) {
  const response = await fetch('http://localhost:3000/orders', {
    method: 'POST',
    body: JSON.stringify({ order }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.message || 'Failed to submit order.');
  }

  return resData;
}


