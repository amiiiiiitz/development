import Player from "./components/Player.jsx";
import GameBoard from "./components/GameBoard.jsx";
import { useState } from "react";
import Log from "./components/Log.jsx";
import { WINNING_COMBINATIONS } from "./winning-combinations.js";
import GameOver from "./components/GameOver.jsx";

const PLAYERS = {
  X: "Player-1",
  O: "Player-2",
};
const initialGameBoard = [
  [null, null, null],
  [null, null, null],
  [null, null, null],
];

function derivedActivePlayer(gameTurns) {
  let currentplayer = "X";
  if (gameTurns.length > 0 && gameTurns[0].player === "X") {
    currentplayer = "O";
  }
  return currentplayer;
}

function derivedGameBoard(gameTurns) {
  let gameBoard = [...initialGameBoard.map((row) => [...row])];

  // for(const turn of turns) {
  //     const {square, player} = turn;
  //     const {row, col} = square;
  //     gameBoard[row][col] = player;
  // }

  gameTurns.forEach((gameTurn) => {
    const { row, col } = gameTurn.square;
    gameBoard[row][col] = gameTurn.player;
  });
  return gameBoard;
}
function derivedWinner(gameBoard, players) {
  let winner = null;
  for (const combination of WINNING_COMBINATIONS) {
    const firstSquareSymbol =
      gameBoard[combination[0].row][combination[0].column];
    const secondSquareSymbol =
      gameBoard[combination[1].row][combination[1].column];
    const thirdSquareSymbol =
      gameBoard[combination[2].row][combination[2].column];

    if (
      firstSquareSymbol &&
      firstSquareSymbol === secondSquareSymbol &&
      firstSquareSymbol === thirdSquareSymbol
    ) {
      winner = players[firstSquareSymbol];
    }
  }
  return winner;
}

function App() {
  const [players, setPlayers] = useState(PLAYERS);
  const [gameTurns, setGameTurns] = useState([]);
  // const [activePlayer, setActivePlayer] = useState('X');

  const activePlayer = derivedActivePlayer(gameTurns);
  const gameBoard = derivedGameBoard(gameTurns);

  const winningPlayer = derivedWinner(gameBoard, players);

  const hasDrawn = gameTurns.length === 9 && !winningPlayer;

  function handleSquareSelect(rowIndex, colIndex) {
    // setActivePlayer((currentActivePlayer) => (currentActivePlayer === 'X' ? 'O' : 'X'));
    setGameTurns((prevTurns) => {
      // let currentplayer = 'X';
      //   if(prevTurns.length > 0 && prevTurns[0].player === 'X') {
      //     currentplayer = 'O';
      //   }
      const currentplayer = derivedActivePlayer(prevTurns);

      const updatedTurns = [
        { square: { row: rowIndex, col: colIndex }, player: currentplayer },
        ...prevTurns,
      ];
      return updatedTurns;
    });
  }

  function handleRestart() {
    setGameTurns([]);
  }
  function handlePlayerNameChange(symbol, newName) {
    setPlayers((prevPlayers) => {
      return {
        ...prevPlayers,
        [symbol]: newName,
      };
    });
  }

  return (
    <main>
      <div id="game-container">
        <ol id="players" className="highlight-player">
          <Player
            initialName={PLAYERS.X}
            symbol="X"
            isActive={activePlayer === "X"}
            onChangeName={handlePlayerNameChange}
          />
          <Player
            initialName={PLAYERS.O}
            symbol="O"
            isActive={activePlayer === "O"}
            onChangeName={handlePlayerNameChange}
          />
        </ol>
        {(winningPlayer || hasDrawn) && (
          <GameOver winner={winningPlayer} onRestart={handleRestart} />
        )}
        <GameBoard onSelectSquare={handleSquareSelect} board={gameBoard} />
      </div>
      <Log turns={gameTurns} />
    </main>
  );
}

export default App;
