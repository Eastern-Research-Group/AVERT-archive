import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
// reducers
import reducer from '../redux/modules/reducer';

// use Chrome Redux Devtools extension if installed
const composeEnhancers = (typeof window !== 'undefined')
  ? (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose)
  : compose;

const middleware = [thunk];

const enhancer = composeEnhancers(applyMiddleware(...middleware));

const configureStore = (preloadedState) => {
  return createStore(reducer, preloadedState, enhancer);
};

export default configureStore;
