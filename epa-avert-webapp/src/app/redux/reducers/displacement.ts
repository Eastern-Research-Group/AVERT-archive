// reducers
import { AppThunk } from 'app/redux/index';
// action creators
import { MonthlyChanges, completeMonthlyEmissions } from './monthlyEmissions';
// config
import { RegionId, StateId, states } from 'app/config';

type PollutantName = 'generation' | 'so2' | 'nox' | 'co2' | 'pm25';

type PollutantDisplacement = {
  regionId: RegionId;
  pollutant: PollutantName;
  original: number;
  post: number;
  impact: number;
  monthlyChanges: MonthlyChanges;
  stateChanges: Partial<{ [key in StateId]: number }>;
};

type RegionalDisplacement = {
  generation: PollutantDisplacement;
  so2: PollutantDisplacement;
  nox: PollutantDisplacement;
  co2: PollutantDisplacement;
  pm25: PollutantDisplacement;
};

export type StateChange = {
  id: StateId;
  name: string;
  generation: number;
  so2: number;
  nox: number;
  co2: number;
  pm25: number;
};

type StatesAndCounties = Partial<{ [key in StateId]: string[] }>;

type DisplacementAction =
  | { type: 'geography/SELECT_REGION' }
  | { type: 'displacement/INCREMENT_PROGRESS' }
  | { type: 'displacement/START_DISPLACEMENT' }
  | { type: 'displacement/COMPLETE_DISPLACEMENT' }
  | { type: 'displacement/RESET_DISPLACEMENT' }
  | { type: 'displacement/REQUEST_DISPLACEMENT_DATA' }
  | {
      type: 'displacement/RECEIVE_DISPLACEMENT_DATA';
      payload: { data: PollutantDisplacement };
    }
  | {
      type: 'displacement/ADD_STATE_CHANGES';
      payload: {
        stateId: StateId;
        pollutantName: PollutantName;
        pollutantValue: number;
      };
    }
  | {
      type: 'displacement/STORE_STATES_AND_COUNTIES';
      payload: { statesAndCounties: StatesAndCounties };
    };

type DisplacementState = {
  status: 'ready' | 'started' | 'complete' | 'error';
  regionalDisplacements: Partial<{ [key in RegionId]: RegionalDisplacement }>;
  stateChanges: Partial<{ [key in StateId]: StateChange }>;
  statesAndCounties: StatesAndCounties;
};

// reducer
const initialState: DisplacementState = {
  status: 'ready',
  regionalDisplacements: {},
  stateChanges: {},
  statesAndCounties: {},
};

export default function reducer(
  state: DisplacementState = initialState,
  action: DisplacementAction,
): DisplacementState {
  switch (action.type) {
    case 'geography/SELECT_REGION':
    case 'displacement/RESET_DISPLACEMENT': {
      return initialState;
    }

    case 'displacement/START_DISPLACEMENT': {
      return {
        ...state,
        status: 'started',
      };
    }

    case 'displacement/COMPLETE_DISPLACEMENT': {
      return {
        ...state,
        status: 'complete',
      };
    }

    case 'displacement/REQUEST_DISPLACEMENT_DATA':
    case 'displacement/INCREMENT_PROGRESS': {
      return state;
    }

    case 'displacement/RECEIVE_DISPLACEMENT_DATA': {
      const { data } = action.payload;

      return {
        ...state,
        regionalDisplacements: {
          ...state.regionalDisplacements,
          [data.regionId]: {
            ...state.regionalDisplacements[data.regionId],
            [data.pollutant]: {
              ...data,
            },
          },
        },
      };
    }

    case 'displacement/ADD_STATE_CHANGES': {
      const updatedState = { ...state };
      const { stateId, pollutantName, pollutantValue } = action.payload;

      // if state hasn't already been added to stateChanges,
      // add it with initial zero values for each pollutant
      if (!updatedState.stateChanges[stateId]) {
        updatedState.stateChanges[stateId] = {
          id: stateId,
          name: states[stateId].name,
          generation: 0,
          so2: 0,
          nox: 0,
          co2: 0,
          pm25: 0,
        };
      }

      // add dispatched pollutant value to previous pollutant value
      const previousPollutantValue =
        updatedState.stateChanges[stateId]?.[pollutantName] || 0;

      return {
        ...updatedState,
        stateChanges: {
          ...updatedState.stateChanges,
          [stateId]: {
            ...updatedState.stateChanges[stateId],
            [pollutantName]: previousPollutantValue + pollutantValue,
          },
        },
      };
    }

    case 'displacement/STORE_STATES_AND_COUNTIES': {
      const { statesAndCounties } = action.payload;

      return {
        ...state,
        statesAndCounties,
      };
    }

    default: {
      return state;
    }
  }
}

// action creators
export function incrementProgress(): DisplacementAction {
  return { type: 'displacement/INCREMENT_PROGRESS' };
}

function fetchDisplacementData(pollutant: PollutantName): AppThunk {
  return (dispatch, getState) => {
    const { api, eere } = getState();

    dispatch({ type: 'displacement/REQUEST_DISPLACEMENT_DATA' });

    // build up displacement requests for selected regions
    const displacementRequests: Promise<Response>[] = [];

    for (const regionId in eere.regionalProfiles) {
      const regionalProfile = eere.regionalProfiles[regionId as RegionId];

      displacementRequests.push(
        fetch(`${api.baseUrl}/api/v1/${pollutant}`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            region: regionId,
            hourlyLoad: regionalProfile?.hourlyEere,
          }),
        }),
      );
    }

    // request all displacement data for selected regions in parallel
    Promise.all(displacementRequests)
      .then((responses) => {
        const displacementData = responses.map((response) => {
          return response.json().then((data: PollutantDisplacement) => {
            dispatch({
              type: 'displacement/RECEIVE_DISPLACEMENT_DATA',
              payload: { data },
            });
            return data;
          });
        });

        return Promise.all(displacementData);
      })
      .then((regionalDisplacements) => {
        dispatch(incrementProgress());

        // build up changes by state for each region (additive)
        regionalDisplacements.forEach((displacement) => {
          for (const key in displacement.stateChanges) {
            const stateId = key as StateId;

            dispatch({
              type: 'displacement/ADD_STATE_CHANGES',
              payload: {
                stateId,
                pollutantName: displacement.pollutant,
                pollutantValue: displacement.stateChanges[stateId] || 0,
              },
            });
          }
        });
      });
  };
}

export function calculateDisplacement(): AppThunk {
  return (dispatch) => {
    dispatch({ type: 'displacement/START_DISPLACEMENT' });
    // whenever we call `incrementProgress()` the progress bar in
    // `components/Panels.tsx` is incremented. we'll initially increment it
    // before fetching any displacement data to give the user a visual que
    // something is happening, and then increment it after each set of
    // displacement data is returned inside the `fetchDisplacementData()`
    // function.
    dispatch(incrementProgress());
    // NOTE: if in the futre we ever fetch data for more pollutants than the 5
    // below (generation, so2, nox, co2, pm25), the value of the `loadingSteps`
    // state stored in `redux/reducers/panel.ts` will need to be updated to be
    // the total number of pollutant displacements + 1
    dispatch(fetchDisplacementData('generation'));
    dispatch(fetchDisplacementData('so2'));
    dispatch(fetchDisplacementData('nox'));
    dispatch(fetchDisplacementData('co2'));
    dispatch(fetchDisplacementData('pm25'));

    dispatch(receiveDisplacement());
  };
}

function receiveDisplacement(): AppThunk {
  return (dispatch, getState) => {
    const { panel, displacement } = getState();

    // recursively call function if data is still fetching
    if (panel.loadingProgress !== panel.loadingSteps) {
      return setTimeout(() => dispatch(receiveDisplacement()), 1000);
    }

    // build up statesAndCounties from each region's monthlyChanges data
    const statesAndCounties: StatesAndCounties = {};

    for (const regionId in displacement.regionalDisplacements) {
      const regionalDisplacement =
        displacement.regionalDisplacements[regionId as RegionId];

      if (regionalDisplacement) {
        // states and counties are the same for all pollutants, so we'll
        // just use generation (it really doesn't matter which we use)
        const countyEmissions =
          regionalDisplacement.generation.monthlyChanges.emissions.county;

        for (const key in countyEmissions) {
          const stateId = key as StateId;
          const stateCountyNames = Object.keys(countyEmissions[stateId]).sort();
          // initialize counties array for state, if state doesn't already exist
          // in `statesAndCounties` and add state county names to array
          // (we initialize and push counties instead of directly assigning
          // counties to a state because states exist within multiple regions,
          // but counties only exist within a single region)
          if (!statesAndCounties[stateId]) statesAndCounties[stateId] = [];
          statesAndCounties[stateId]?.push(...stateCountyNames);
        }
      }
    }

    // sort counties within each state
    for (const key in statesAndCounties) {
      const stateId = key as StateId;
      statesAndCounties[stateId] = statesAndCounties[stateId]?.sort();
    }

    dispatch({
      type: 'displacement/STORE_STATES_AND_COUNTIES',
      payload: { statesAndCounties },
    });

    dispatch({ type: 'displacement/COMPLETE_DISPLACEMENT' });

    dispatch(completeMonthlyEmissions()); // TODO: remove once no longer needed
  };
}

export function resetDisplacement(): DisplacementAction {
  return { type: 'displacement/RESET_DISPLACEMENT' };
}
