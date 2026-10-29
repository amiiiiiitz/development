import { useState } from "react";

export function useInput(defaultValue, validationFn) {
  const [enteredValue, setEnteredValue] = useState(defaultValue);
  const [didEdit, setDidEdit] = useState(false);

	const valueIsValid = validationFn(enteredValue);

  function handleInputBlur() {
    setDidEdit(true);
  }

  function handleInputChange(event) {
    setEnteredValue(event.target.value);
    setDidEdit(false); // this is used here to validate properly fix the showing to long issue
  }

	return {
		value: enteredValue,
		handleInputBlur,
		handleInputChange,
		hasError: didEdit && !valueIsValid
	}
}
