import { Action, combineReducers } from 'redux';
import { ThunkAction } from 'redux-thunk';
// reducers
import region from 'app/redux/region';
import panel from 'app/redux/panel';
import api from 'app/redux/api';
import rdfs from 'app/redux/rdfs';
import generation from 'app/redux/generation';
import so2 from 'app/redux/so2';
import nox from 'app/redux/nox';
import co2 from 'app/redux/co2';
import pm25 from 'app/redux/pm25';
import eere from 'app/redux/eere';
import annualDisplacement from 'app/redux/annualDisplacement';
import stateEmissions from 'app/redux/stateEmissions';
import monthlyEmissions from 'app/redux/monthlyEmissions';
import dataDownload from 'app/redux/dataDownload';

const rootReducer = combineReducers({
  region,
  panel,
  api,
  rdfs,
  generation,
  so2,
  nox,
  co2,
  pm25,
  eere,
  annualDisplacement,
  stateEmissions,
  monthlyEmissions,
  dataDownload,
});

export default rootReducer;

// -----------------------------------------------------------------------------
// types used in other reducers
// -----------------------------------------------------------------------------
type RootState = ReturnType<typeof rootReducer>;

type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>;

type DataByMonth = {
  [MonthNumber in 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12]: number;
};

type MonthlyChanges = {
  emissions: {
    region: DataByMonth;
    state: {
      [stateId: string]: DataByMonth;
    };
    county: {
      [stateId: string]: {
        [countyName: string]: DataByMonth;
      };
    };
  };
  percentages: {
    region: DataByMonth;
    state: {
      [stateId: string]: DataByMonth;
    };
    county: {
      [stateId: string]: {
        [countyName: string]: DataByMonth;
      };
    };
  };
};

type DisplacementData = {
  original: number;
  post: number;
  impact: number;
  monthlyChanges: MonthlyChanges;
  stateChanges: {
    [stateId: string]: number;
  };
};

export type { AppThunk, DataByMonth, MonthlyChanges, DisplacementData };
