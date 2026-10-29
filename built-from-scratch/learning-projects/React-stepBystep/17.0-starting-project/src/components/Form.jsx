import { useActionState, useContext, useEffect, useRef, useState } from "react";
import { OrderStateContext } from "../order-context.jsx";
import { updateOrders } from "../http.js";


async function signupAction(prevState, formData, items) {
  const errors = [];
  const submitCount = (prevState?.submitCount || 0) + 1;

  const name = formData.get("full-name")?.trim() || "";
  const email = formData.get("email")?.trim() || "";
  const phone = formData.get("phone")?.trim() || "";
  const street = formData.get("street")?.trim() || "";
  const postal = formData.get("postal-code")?.trim() || "";
  const city = formData.get("city")?.trim() || "";


  if (!name) errors.push("Full name is required.");
  if (!email || !email.includes("@")) errors.push("Please enter a valid email address.");
  if (!phone) errors.push("Phone is required.");
  if (!street) errors.push("Street is required.");
  if (!postal) errors.push("Postal code is required.");
  if (!city) errors.push("City is required.");
  if (!items || items.length === 0) errors.push("No items in cart.");

  if (errors.length > 0) {
    return {
      errors,
      enteredValue: { name, email, phone, street, postal, city },
      success: false,
      submitCount,
    };
  }

  try {
    await updateOrders({
      items,
      customer: {
        name,
        email,
        phone,
        street,
        "postal-code": postal,
        city,
      },
    });

    return { errors: null, enteredValue: null, success: true, submitCount };
  } catch (error) {
    return {
      errors: [error.message || "Failed to submit order."],
      enteredValue: { name, email, phone, street, postal, city },
      success: false,
      submitCount,
    };
  }
}

export default function Form() {
  const { updatedOrder, closeCheckout, openSubmit } = useContext(OrderStateContext);

  const formRef = useRef();
  const handledSubmitCount = useRef(0);

  const [formState, formAction] = useActionState(
    (prevState, formData) => signupAction(prevState, formData, updatedOrder.items),
    {
      errors: null,
      enteredValue: null,
      success: false,
      submitCount: 0,
    }
  );

  const [formKey, setFormKey] = useState(0);

  // Run success logic only after successful submission
  useEffect(() => {
    if (!formState.success) return;
    if (formState.submitCount === handledSubmitCount.current) return;

    handledSubmitCount.current = formState.submitCount;
    formRef.current?.reset();
    setFormKey((prev) => prev + 1);

    openSubmit?.();
    closeCheckout?.();
  }, [formState.success, formState.submitCount, openSubmit, closeCheckout]);

  function handleReset() {
    formRef.current?.reset();
    setFormKey((prev) => prev + 1);
  }

  return (
    <form key={formKey} ref={formRef} action={formAction}>
      <div className="control">
        <label htmlFor="full-name">Full Name</label>
        <input
          id="full-name"
          name="full-name"
          type="text"
          defaultValue={formState.enteredValue?.name || ""}
        />
      </div>

      <div className="control-row">
        <div className="control">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={formState.enteredValue?.email || ""}
          />
        </div>

        <div className="control">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={formState.enteredValue?.phone || ""}
          />
        </div>
      </div>

      <div className="control">
        <label htmlFor="street">Street</label>
        <input
          id="street"
          name="street"
          type="text"
          defaultValue={formState.enteredValue?.street || ""}
        />
      </div>

      <div className="control-row">
        <div className="control">
          <label htmlFor="postal-code">Postal Code</label>
          <input
            id="postal-code"
            name="postal-code"
            type="text"
            defaultValue={formState.enteredValue?.postal || ""}
          />
        </div>

        <div className="control">
          <label htmlFor="city">City</label>
          <input
            id="city"
            name="city"
            type="text"
            defaultValue={formState.enteredValue?.city || ""}
          />
        </div>
      </div>

      {formState.errors && (
        <ul className="error">
          {formState.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <p className="modal-actions">
        <button type="button" className="button" onClick={handleReset}>
          Reset
        </button>

        <button type="submit" className="button">
          Submit
        </button>
      </p>
    </form>
  );
}
