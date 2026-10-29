import { useActionState } from "react";
import {
  isEmail,
  isNotEmpty,
  isEqualsToOtherValue,
  hasMinLength,
} from "../util/validation";

function signupAction(prevState, formData) {
  const errors = [];

  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirm-password");
  const firstName = formData.get("first-name");
  const lastName = formData.get("last-name");
  const role = formData.get("role");
  const acquisition = formData.getAll("acquisition");
  const termsAccepted = formData.get("terms");

  if (!isNotEmpty(email) || !isEmail(email)) {
    errors.push("Please enter a valid email address.");
  }

  if (!isNotEmpty(password) || !hasMinLength(password, 6)) {
    errors.push("Password must be at least 6 characters long.");
  }

  if (!isEqualsToOtherValue(password, confirmPassword)) {
    errors.push("Passwords do not match.");
  }

  if (!isNotEmpty(firstName)) {
    errors.push("First name is required.");
  }

  if (!isNotEmpty(lastName)) {
    errors.push("Last name is required.");
  }

  if (!isNotEmpty(role)) {
    errors.push("Please select a role.");
  }

  if (acquisition.length === 0) {
    errors.push("Please select at least one way you found us.");
  }

  if (!termsAccepted) {
    errors.push("You must accept the terms and conditions.");
  }

  if (errors.length > 0) {
    return {
      errors,
      enteredValue: {
        email,
        password,
        confirmPassword,
        firstName,
        lastName,
        role,
        acquisition,
        termsAccepted,
      },
    };
  }

  return { errors: null };
}

export default function Signup() {
  const [formState, formAction] = useActionState(signupAction, {
    errors: null,
  });

  return (
    <form action={formAction}>
      <h2>Welcome on board!</h2>
      <p>We just need a little bit of data from you to get you started 🚀</p>

      <div className="control">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          defaultValue={formState.enteredValue?.email}
        />
      </div>

      <div className="control-row">
        <div className="control">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            defaultValue={formState.enteredValue?.password}
          />
        </div>

        <div className="control">
          <label htmlFor="confirm-password">Confirm Password</label>
          <input
            id="confirm-password"
            type="password"
            name="confirm-password"
            defaultValue={formState.enteredValue?.confirmPassword}
          />
        </div>
      </div>

      <hr />

      <div className="control-row">
        <div className="control">
          <label htmlFor="first-name">First Name</label>
          <input
            type="text"
            id="first-name"
            name="first-name"
            defaultValue={formState.enteredValue?.firstName}
          />
        </div>

        <div className="control">
          <label htmlFor="last-name">Last Name</label>
          <input
            type="text"
            id="last-name"
            name="last-name"
            defaultValue={formState.enteredValue?.lastName}
          />
        </div>
      </div>

      <div className="control">
        <label htmlFor="role">What best describes your role?</label>
        <select
          id="role"
          name="role"
          defaultValue={formState.enteredValue?.role}
        >
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
            defaultChecked={formState.enteredValue?.acquisition?.includes(
              "google",
            )}
          />
          <label htmlFor="google">Google</label>
        </div>

        <div className="control">
          <input
            type="checkbox"
            id="friend"
            name="acquisition"
            value="friend"
            defaultChecked={formState.enteredValue?.acquisition?.includes(
              "friend",
            )}
          />
          <label htmlFor="friend">Referred by friend</label>
        </div>

        <div className="control">
          <input
            type="checkbox"
            id="other"
            name="acquisition"
            value="other"
            defaultChecked={formState.enteredValue?.acquisition?.includes(
              "other",
            )}
          />
          <label htmlFor="other">Other</label>
        </div>
      </fieldset>

      <div className="control">
        <label htmlFor="terms-and-conditions">
          <input
            type="checkbox"
            id="terms-and-conditions"
            name="terms"
            defaultChecked={formState.enteredValue?.termsAccepted}
          />
          I agree to the terms and conditions
        </label>
      </div>

      {formState.errors && (
        <ul className="error">
          {formState.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

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
