import {useState, useRef} from 'react';

export default function Player() {
  const cuurentPlayerName = useRef();
  const [playerName, setPlayerName] = useState();
  
  function handleClick () {
    setPlayerName(cuurentPlayerName.current.value);
    cuurentPlayerName.current.value = '';
  }
  return (
    <section id="player">
      <h2>Welcome { playerName ?? 'unknown entity'}</h2>
      <p>
        <input ref = {cuurentPlayerName} type="text"/>
        <button onClick = {handleClick}>Set Name</button>
      </p>
    </section>
  );
}
