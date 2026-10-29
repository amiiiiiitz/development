import { useRef } from "react";

export default function Signup() {
  const passwordRef = useRef();
  const confirmPasswordRef = useRef();

  function handleSubmit(event) {
    event.preventDefault();

    const fd = new FormData(event.target); // fd.get("email")
    const acquisition = fd.getAll("acquisition");
    const data = Object.fromEntries(fd.entries());
    // fd.entries gives arrays of all input field values and obj.frm give us object from the array but here multivalued input field get lost thats why we extract all the multi values by getAll
    data.acquisition = acquisition;

    console.log(data);

    event.target.reset();
  }

  function validatePasswordMatch() { // we can do this validation using one state then we dont need to use setCustomValidity function but to show the error message by our own 
    if (confirmPasswordRef.current.value !== passwordRef.current.value) {
      confirmPasswordRef.current.setCustomValidity("Passwords do not match");
    } else {
      confirmPasswordRef.current.setCustomValidity("");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Welcome on board!</h2>
      <p>We just need a little bit of data from you to get you started 🚀</p>

      <div className="control">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" name="email" required />
      </div>

      <div className="control-row">
        <div className="control">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            required
            minLength={5}
            pattern="(?=.*[A-Za-z])(?=.*\d).*"
            title="Password must include at least one letter and one number"
            ref={passwordRef}
            onChange={validatePasswordMatch}
          />
        </div>

        <div className="control">
          <label htmlFor="confirm-password">Confirm Password</label>
          <input
            id="confirm-password"
            type="password"
            name="confirm-password"
            required
            ref={confirmPasswordRef}
            onChange={validatePasswordMatch}
          />
        </div>
      </div>

      <hr />

      <div className="control-row">
        <div className="control">
          <label htmlFor="first-name">First Name</label>
          <input type="text" id="first-name" name="first-name" />
        </div>

        <div className="control">
          <label htmlFor="last-name">Last Name</label>
          <input type="text" id="last-name" name="last-name" />
        </div>
      </div>

      <div className="control">
        <label htmlFor="role">What best describes your role?</label>
        <select id="role" name="role">
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="employee">Employee</option>
          <option value="founder">Founder</option>
          <option value="other">Other</option>
        </select>
      </div>

      <fieldset>
        <legend>How did you find us?</legend>

        <div className="control">
          <input
            type="checkbox"
            id="google"
            name="acquisition"
            value="google"
          />
          <label htmlFor="google">Google</label>
        </div>

        <div className="control">
          <input
            type="checkbox"
            id="friend"
            name="acquisition"
            value="friend"
          />
          <label htmlFor="friend">Referred by friend</label>
        </div>

        <div className="control">
          <input type="checkbox" id="other" name="acquisition" value="other" />
          <label htmlFor="other">Other</label>
        </div>
      </fieldset>

      <div className="control">
        <label htmlFor="terms-and-conditions">
          <input
            type="checkbox"
            id="terms-and-conditions"
            name="terms"
            required
          />
          I agree to the terms and conditions
        </label>
      </div>

      <p className="form-actions">
        <button type="reset" className="button button-flat">
          Reset
        </button>
        <button type="submit" className="button">
          Sign up
        </button>
      </p>
    </form>
  );
}

// // The built-in button type="reset" automatically resets the form,
// // but it only works when that specific reset button is clicked.
// //
// // You can also reset the form programmatically using:
// // event.target.reset()
// // This is useful if you want to reset the form after a successful
// // submit or signup instead of relying on a reset button.
// //
// // If you are using state or refs, you must manually reset them
// // by setting the state back to its initial values (e.g. "") or
// // clearing the refs, since the browser reset does not affect React state.
