const redux = require('redux');

const counterReducer = (state = {counter: 0}, action) =>{
	if(action.type === 'increment'){	
	return {
		counter: state.counter + 1 // here we can return anything and the shape can also be anything we want
	}
	if(action.type === 'decrement'){
		return {
			counter: state.counter - 1
		}
	}
	return state; // if we return state here, it will be the default value of state in the beginning
}; // execute by redux

const store  = redux.createStore(counterReducer); // execute by redux, it creates a store and takes the reducer as an argument

const counterSubscriber = () => {
	const latestState = store.getState(); // gives us latest state snapshot when available
}

store.subscribe(counterSubscriber); // executed by redux

store.dispatch({type: 'increment'}); // execute by us
store.dispatch({type: 'decrement'}); // execute by us


// redux is a state management library for JavaScript applications. It helps to manage the state of an application in a predictable way. The main idea behind Redux is that the state of the application is stored in a single object called the "store". The store can only be updated by dispatching actions, which are plain JavaScript objects that describe what happened. The reducer function takes the current state and an action as arguments and returns a new state based on the action type. This allows for a clear separation of concerns and makes it easier to debug and test the application.

// redux toolkit version of the above code
const { configureStore } = require('@reduxjs/toolkit');

const counterReducer = (state = { counter: 0 }, action) => {

	if (action.type === 'increment') {
		return {
			counter: state.counter + 1
		};
	}

	if (action.type === 'decrement') {
		return {
			counter: state.counter - 1
		};
	}

	return state;
};

const store = configureStore({
	reducer: counterReducer
}); // configureStore is a function that takes an object as an argument and returns a store. The object can have a reducer property, which is the reducer function that we defined earlier. The configureStore function also takes care of setting up the store with the necessary middleware and devtools for debugging.

const counterSubscriber = () => {
	const latestState = store.getState();
};

store.subscribe(counterSubscriber);

store.dispatch({ type: 'increment' });
store.dispatch({ type: 'decrement' });
