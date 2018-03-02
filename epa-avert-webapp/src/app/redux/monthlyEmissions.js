// action types
import { SELECT_REGION } from 'app/redux/region';
import { START_DISPLACEMENT } from 'app/redux/annualDisplacement';
export const RENDER_MONTHLY_EMISSIONS_CHARTS = 'monthlyEmissions/RENDER_MONTHLY_EMISSIONS_CHARTS'; // prettier-ignore
export const COMPLETE_MONTHLY_EMISSIONS = 'monthlyEmissions/COMPLETE_MONTHLY_EMISSIONS'; // prettier-ignore
export const SET_DOWNLOAD_DATA = 'monthlyEmissions/SET_DOWNLOAD_DATA';
export const SELECT_MONTHLY_AGGREGATION = 'monthlyEmissions/SELECT_MONTHLY_AGGREGATION'; // prettier-ignore
export const SELECT_MONTHLY_UNIT = 'monthlyEmissions/SELECT_MONTHLY_UNIT';
export const SELECT_MONTHLY_STATE = 'monthlyEmissions/SELECT_MONTHLY_STATE';
export const SELECT_MONTHLY_COUNTY = 'monthlyEmissions/SELECT_MONTHLY_COUNTY';
export const RESET_MONTHLY_EMISSIONS = 'monthlyEmissions/RESET_MONTHLY_EMISSIONS'; // prettier-ignore

// reducer
const initialState = {
  status: 'select_region',
  aggregation: 'region',
  unit: 'emissions',
  availableStates: [],
  availableCounties: [],
  selectedState: '',
  selectedCounty: '',
  statesAndCounties: {},
  output: {
    so2: [],
    nox: [],
    co2: [],
    pm25: [],
  },
  downloadableData: [],
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case SELECT_REGION:
      return {
        ...state,
        status: 'ready',
      };

    case START_DISPLACEMENT:
      return {
        ...state,
        status: 'started',
      };

    case COMPLETE_MONTHLY_EMISSIONS:
      return {
        ...state,
        status: 'complete',
        statesAndCounties: action.statesAndCounties,
        availableStates: Object.keys(action.statesAndCounties),
      };

    case SELECT_MONTHLY_AGGREGATION:
      return {
        ...state,
        aggregation: action.aggregation,
      };

    case SELECT_MONTHLY_UNIT:
      return {
        ...state,
        unit: action.unit,
      };

    case SELECT_MONTHLY_STATE:
      return {
        ...state,
        selectedState: action.selectedState,
        selectedCounty: '',
        availableCounties: action.availableCounties,
      };

    case SELECT_MONTHLY_COUNTY:
      return {
        ...state,
        selectedCounty: action.selectedCounty,
      };

    case RENDER_MONTHLY_EMISSIONS_CHARTS:
      const { unit, aggregation, selectedState, selectedCounty } = state;

      const emissionData = {
        so2: [],
        nox: [],
        co2: [],
        pm25: [],
      };

      // populate emissionData with data from action (pollutant data from store)
      for (const pollutant in emissionData) {
        if (aggregation === 'region') {
          emissionData[pollutant] = Object.values(
            action[pollutant][unit].region,
          );
        }

        if (aggregation === 'state' && selectedState) {
          emissionData[pollutant] = Object.values(
            action[pollutant][unit].state[selectedState],
          );
        }

        if (aggregation === 'county' && selectedState && selectedCounty) {
          emissionData[pollutant] = Object.values(
            action[pollutant][unit].county[selectedState][selectedCounty],
          );
        }
      }

      // multiply each emission datapoint by 100 if unit is 'percentages'
      if (unit === 'percentages') {
        for (const pollutant in emissionData) {
          emissionData[pollutant].forEach(
            (data, index, array) => (array[index] = data * 100),
          );
        }
      }

      return {
        ...state,
        output: emissionData,
      };

    case RESET_MONTHLY_EMISSIONS:
      return initialState;

    case SET_DOWNLOAD_DATA:
      const dataRow = (pollutant, unit, data, state, county) => {
        data = Object.values(data);

        return {
          type: pollutant,
          'aggregation level': county ? 'County' : state ? 'State' : 'Regional',
          state: state ? state : null,
          county: county ? county : null,
          'emissions unit': unit,
          january: data[0],
          february: data[1],
          march: data[2],
          april: data[3],
          may: data[4],
          june: data[5],
          july: data[6],
          august: data[7],
          september: data[8],
          october: data[9],
          november: data[10],
          december: data[11],
        };
      };

      let rows = [];
      // region
      rows.push(dataRow('SO2', 'emissions (pounds)', action.so2.emissions.region)); // prettier-ignore
      rows.push(dataRow('NOX', 'emissions (pounds)', action.nox.emissions.region)); // prettier-ignore
      rows.push(dataRow('CO2', 'emissions (tons)', action.co2.emissions.region)); // prettier-ignore
      rows.push(dataRow('PM25', 'emissions (pounds)', action.pm25.emissions.region)); // prettier-ignore
      rows.push(dataRow('SO2', 'percentages', action.so2.percentages.region)); // prettier-ignore
      rows.push(dataRow('NOX', 'percentages', action.nox.percentages.region)); // prettier-ignore
      rows.push(dataRow('CO2', 'percentages', action.co2.percentages.region)); // prettier-ignore
      rows.push(dataRow('PM25', 'percentages', action.pm25.percentages.region)); // prettier-ignore
      // states
      Object.keys(state.statesAndCounties).forEach((s) => {
        rows.push(dataRow('SO2', 'emissions (pounds)', action.so2.emissions.state[s], s)); // prettier-ignore
        rows.push(dataRow('NOX', 'emissions (pounds)', action.nox.emissions.state[s], s)); // prettier-ignore
        rows.push(dataRow('CO2', 'emissions (tons)', action.co2.emissions.state[s], s)); // prettier-ignore
        rows.push(dataRow('PM25', 'emissions (pounds)', action.pm25.emissions.state[s], s)); // prettier-ignore
        rows.push(dataRow('SO2', 'percentages', action.so2.percentages.state[s], s)); // prettier-ignore
        rows.push(dataRow('NOX', 'percentages', action.nox.percentages.state[s], s)); // prettier-ignore
        rows.push(dataRow('CO2', 'percentages', action.co2.percentages.state[s], s)); // prettier-ignore
        rows.push(dataRow('PM25', 'percentages', action.pm25.percentages.state[s], s)); // prettier-ignore
        // counties
        state.statesAndCounties[s].forEach((c) => {
          rows.push(dataRow('SO2', 'emissions (pounds)', action.so2.emissions.county[s][c], s, c)); // prettier-ignore
          rows.push(dataRow('NOX', 'emissions (pounds)', action.nox.emissions.county[s][c], s, c)); // prettier-ignore
          rows.push(dataRow('CO2', 'emissions (tons)', action.co2.emissions.county[s][c], s, c)); // prettier-ignore
          rows.push(dataRow('PM25', 'emissions (pounds)', action.pm25.emissions.county[s][c], s, c)); // prettier-ignore
          rows.push(dataRow('SO2', 'percentages', action.so2.percentages.county[s][c], s, c)); // prettier-ignore
          rows.push(dataRow('NOX', 'percentages', action.nox.percentages.county[s][c], s, c)); // prettier-ignore
          rows.push(dataRow('CO2', 'percentages', action.co2.percentages.county[s][c], s, c)); // prettier-ignore
          rows.push(dataRow('PM25', 'percentages', action.pm25.percentages.county[s][c], s, c)); // prettier-ignore
        });
      });

      return {
        ...state,
        downloadableData: rows,
      };

    default:
      return state;
  }
}

export const renderMonthlyEmissionsCharts = () => {
  return function(dispatch, getState) {
    // get each pollutant's monthly changes from store to use in dispatched action
    const { so2, nox, co2, pm25 } = getState();

    dispatch({
      type: RENDER_MONTHLY_EMISSIONS_CHARTS,
      so2: so2.data.monthlyChanges,
      nox: nox.data.monthlyChanges,
      co2: co2.data.monthlyChanges,
      pm25: pm25.data.monthlyChanges,
    });
  };
};

export const completeMonthlyEmissions = (statesAndCounties) => {
  return function(dispatch, getState) {
    // get each pollutant's monthly changes from store to use in dispatched action
    const { so2, nox, co2, pm25 } = getState();

    dispatch({
      type: COMPLETE_MONTHLY_EMISSIONS,
      statesAndCounties: statesAndCounties,
    });

    dispatch({
      type: SET_DOWNLOAD_DATA,
      so2: so2.data.monthlyChanges,
      nox: nox.data.monthlyChanges,
      co2: co2.data.monthlyChanges,
      pm25: pm25.data.monthlyChanges,
    });

    dispatch(renderMonthlyEmissionsCharts());
  };
};

export const selectMonthlyAggregation = (selection) => {
  return function(dispatch) {
    dispatch({
      type: SELECT_MONTHLY_AGGREGATION,
      aggregation: selection,
    });
    dispatch(renderMonthlyEmissionsCharts());
  };
};

export const selectMonthlyUnit = (selection) => {
  return function(dispatch) {
    dispatch({
      type: SELECT_MONTHLY_UNIT,
      unit: selection,
    });
    dispatch(renderMonthlyEmissionsCharts());
  };
};

export const selectMonthlyState = (selection) => {
  return function(dispatch, getState) {
    const { monthlyEmissions } = getState();

    dispatch({
      type: SELECT_MONTHLY_STATE,
      selectedState: selection,
      availableCounties: monthlyEmissions.statesAndCounties[selection],
    });
    dispatch(renderMonthlyEmissionsCharts());
  };
};

export const selectMonthlyCounty = (selection) => {
  return function(dispatch) {
    dispatch({
      type: SELECT_MONTHLY_COUNTY,
      selectedCounty: selection,
    });
    dispatch(renderMonthlyEmissionsCharts());
  };
};

export const resetMonthlyEmissions = () => ({
  type: RESET_MONTHLY_EMISSIONS,
});
