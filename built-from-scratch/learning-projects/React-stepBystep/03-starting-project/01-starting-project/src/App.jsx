import Header from './Components/Header.jsx';
import InputBox from './Components/InputBox.jsx';
import { useState } from 'react';
import Results from './Components/Results.jsx';

function App() {
  const [userInput, setUserInput] = useState({
        initialInvestment: 1000,
        annualInvestment: 1200,
        expectedReturn: 6,
        duration: 10,
  });

  function handleChange(inputIdentifier, newValue) {
      setUserInput(prevInput => {
          return {
              ...prevInput,
              [inputIdentifier]: newValue === '' ? '' : +newValue,
          }
      });
  }

  const inputIsValid = userInput.duration >= 1;
  return (
    <>
      <Header />
      <InputBox userInput = {userInput} onChange = {handleChange}/>
      {!inputIsValid && <p className='center'>please enter a duration greater than 0</p>}
      {inputIsValid && <Results input = {userInput} />}
    </>
  );
}

export default App
