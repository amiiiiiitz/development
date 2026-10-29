import { useState } from 'react';
import Input from './Input.jsx';
import Button from './Button.jsx';

export default function AuthInputs() {
  const [enteredEmail, setEnteredEmail] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleLogin() {
    setSubmitted(true);
  }

  const emailNotValid =
    submitted && !enteredEmail.includes('@');
  const passwordNotValid =
    submitted && enteredPassword.trim().length < 6;

  return (
    <div id="auth-inputs" className="w-full max-w-sm mx-auto p-8 rounded shadow-md bg-gradient-to-b from-stone-700 to-stone-800">
      <div className='flex flex-col gap-2 mb-2'>
        <Input
          label="Email"
          type="email"
          value={enteredEmail}
          onChange={(e) => setEnteredEmail(e.target.value)}
          invalid={emailNotValid}
        />

        <Input
          label="Password"
          type="password"
          value={enteredPassword}
          onChange={(e) => setEnteredPassword(e.target.value)}
          invalid={passwordNotValid}
        />
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" className="text-amber-400 hover:text-amber-500">
          Create a new account
        </button>
        <Button onClick={handleLogin}>Sign In</Button>
      </div>
    </div>
  );
}
