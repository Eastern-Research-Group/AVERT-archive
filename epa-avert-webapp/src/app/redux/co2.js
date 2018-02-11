// engine
import { avert } from 'app/actions';
// action creators
import { incrementProgress } from 'app/actions';

// actions
const REQUEST_CO2 = 'co2/REQUEST_CO2';
const RECEIVE_CO2 = 'co2/RECEIVE_CO2';
const RECEIVE_JOB_ID = 'co2/RECEIVE_JOB_ID';
const POLL_SERVER_FOR_DATA = 'co2/POLL_SERVER_FOR_DATA';

// reducer
export const initialState = {
  isFetching: false,
  jobId: 0,
  data: {},
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case REQUEST_CO2:
      return {
        ...state,
        isFetching: true,
      };

    case RECEIVE_CO2:
      return {
        ...state,
        isFetching: false,
        data: action.json.data,
      };

    case RECEIVE_JOB_ID:
      return {
        ...state,
        jobId: action.json.job,
      };

    default:
      return state;
  }
}

// action creators
function pollServerForData() {
  return (dispatch, getState) => {
    const { api, co2 } = getState();
    // dispatch 'poll server for data' action
    dispatch({
      type: POLL_SERVER_FOR_DATA,
      jobId: co2.jobId,
    });
    // fetch co2 data via job id
    return fetch(`${api.baseUrl}/api/v1/jobs/${co2.jobId}`)
      .then(response => response.json())
      .then(json => {
        // recursively call function if response from server is 'in progress'
        if (json.response === 'in progress') {
          return setTimeout(() => dispatch(pollServerForData()), api.pollingFrequency)
        }
        // dispatch 'incrementProgress' and 'receive co2' actions
        dispatch(incrementProgress());
        dispatch({
          type: RECEIVE_CO2,
          json: json,
        });
      });
  };
}

export function fetchCo2() {
  return (dispatch, getState) => {
    const { api } = getState();
    // dispatch 'request co2' action
    dispatch({ type: REQUEST_CO2 });
    // post co2 data for region and receive a job id
    const options = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
      body: JSON.stringify({
        region: avert.regionSlug,
        eere: avert.eereLoad.hourlyEere
      }),
    };
    return fetch(`${api.baseUrl}/api/v1/co2`, options)
      .then(response => response.json())
      .then(json => {
        // dispatch 'receive job id' and 'poll server for data' actions
        dispatch({
          type: RECEIVE_JOB_ID,
          json: json,
        });
        dispatch(pollServerForData());
      });
  };
}
