import { Action, combineReducers } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { useSelector, TypedUseSelectorHook } from 'react-redux';
// ---
import api from 'app/redux/reducers/api';
import panel from 'app/redux/reducers/panel';
import geography from 'app/redux/reducers/geography';
import transportation from 'app/redux/reducers/transportation';
import eere from 'app/redux/reducers/eere';
import results from 'app/redux/reducers/results';
import displacement from 'app/redux/reducers/displacement';
import monthlyEmissions from 'app/redux/reducers/monthlyEmissions';

export const rootReducer = combineReducers({
  api,
  panel,
  geography,
  transportation,
  eere,
  results,
  displacement,
  monthlyEmissions,
});

type RootState = ReturnType<typeof rootReducer>;

export type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>;

export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;
