import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { eereProfile } from 'app/engines';
import eereReducer, {
  RESET_EERE_INPUTS,
  resetEereInputs,
} from 'app/redux/reducers/eere';

const mockStore = configureMockStore([thunk]);
const store = mockStore();

describe('eereReducer', () => {
  const initialState = {
    status: 'ready',
    valid: true,
    errors: [],
    inputs: {
      annualGwh: '',
      constantMwh: '',
      broadProgram: '',
      reduction: '',
      topHours: '',
      windCapacity: '',
      utilitySolar: '',
      rooftopSolar: '',
    },
    limits: {
      annualGwh: false,
      constantMwh: false,
      renewables: false,
    },
    softLimit: {
      valid: true,
      topExceedanceValue: 0,
      topExceedanceTimestamp: {},
    },
    hardLimit: {
      valid: true,
      topExceedanceValue: 0,
      topExceedanceTimestamp: {},
    },
    hourlyEere: [],
  };

  it('should return an initial state', () => {
    expect(eereReducer(undefined, {})).toEqual(initialState);
  });

  it('should handle RESET_EERE_INPUTS', () => {
    expect(eereReducer(undefined, { type: RESET_EERE_INPUTS })).toEqual(initialState); // prettier-ignore
  });
});

describe('EERE related actions', () => {
  it('resetEereInputs should reset redux state and AVERT engine state', () => {
    eereProfile.topHours = 5;
    store.dispatch(resetEereInputs());

    expect(store.getActions()).toEqual([{ type: RESET_EERE_INPUTS }]);
    expect(eereProfile.topHours).toBe(0);
    expect(eereProfile.topHours).not.toBe(5);
  });
});
