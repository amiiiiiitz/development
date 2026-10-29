// import { useDispatch, useSelector } from 'react-redux';
// import classes from './Counter.module.css';


// const Counter = () => {
//   const dispatch = useDispatch(); //this returns a function and gives us access to the dispatch function from the redux store. we can use this function to dispatch actions to the store, which will then update the state based on the reducer logic. in this component, we will use the dispatch function to dispatch increment and decrement actions when the respective buttons are clicked. by using useDispatch, we can easily interact with the redux store and trigger state updates without having to manually connect our component to the store or use higher-order components like connect from react-redux.
  
//   const counter = useSelector(state => state.counter); // here redux passes the state to the function and we can select the part of the state we want to use in this component. when we are using useSelector, the component will automatically re-render whenever the selected state changes. so in this case, whenever the counter value changes, this component will re-render and show the updated counter value. in ohterword useSelector sets up a subscription to the redux store and whenever the selected state changes, it will trigger a re-render of the component. this is how we can keep our component in sync with the redux store and ensure that it always displays the latest state. if the component unmounts, the subscription will be automatically removed to prevent memory leaks by redux. this is a convenient way to access the state from the redux store without having to manually subscribe and unsubscribe to the store.

//   const showCounter = useSelector(state => state.showCounter);
//   const incrementHandler = () => {
//     dispatch({ type: 'increment' }); // this is how we dispatch an action to the redux store. we call the dispatch function and pass an action object with a type property. in this case, we are dispatching an action of type 'increment', which will be handled by the reducer to update the state accordingly. when this button is clicked, it will trigger the incrementHandler function, which will dispatch the increment action to the store, causing the counter value to increase by 1.
//   };

//   const increaseHandler = () => {
//     dispatch({ type: 'increase', amount: 5 }); 
//   }
//   const decrementHandler = () => {
//     dispatch({ type: 'decrement' }); 
//   };

//   const toggleCounterHandler = () => {
//     dispatch({ type: 'toggle' });
//   };
//   return (
//     <main className={classes.counter}>
//       <h1>Redux Counter</h1>
//       {showCounter && <div className={classes.value}>{counter}</div>}
//       <div>
//         <button onClick={incrementHandler}>Increment</button>
//         <button onClick={increaseHandler}>Increase by 5</button>
//         <button onClick={decrementHandler}>Decrement</button>
//       </div>
//       <button onClick={toggleCounterHandler}>Toggle Counter</button>
//     </main>
//   );
// };

// export default Counter;

import { useDispatch, useSelector } from 'react-redux';
import classes from './Counter.module.css';
import { counterActions } from '../store';


const Counter = () => {
  const dispatch = useDispatch(); 
  
  const counter = useSelector(state => state.counter.counter); 

  const showCounter = useSelector(state => state.counter.showCounter);
  const incrementHandler = () => {
    dispatch(counterActions.increment()); 
  };

  const increaseHandler = () => {
    dispatch(counterActions.increase(5)); 
  }
  const decrementHandler = () => {
    dispatch(counterActions.decrement()); 
  };

  const toggleCounterHandler = () => {
    dispatch(counterActions.toggleCounter());
  };
  return (
    <main className={classes.counter}>
      <h1>Redux Counter</h1>
      {showCounter && <div className={classes.value}>{counter}</div>}
      <div>
        <button onClick={incrementHandler}>Increment</button>
        <button onClick={increaseHandler}>Increase by 5</button>
        <button onClick={decrementHandler}>Decrement</button>
      </div>
      <button onClick={toggleCounterHandler}>Toggle Counter</button>
    </main>
  );
};

export default Counter;
