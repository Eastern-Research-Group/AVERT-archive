import { useSelector, TypedUseSelectorHook } from 'react-redux';
// reducers
import { AppThunk, MonthlyChanges } from 'app/redux/index';
// enums
import States from 'app/enums/States';
import FipsCodes from 'app/enums/FipsCodes';
// action types
import { SELECT_REGION } from 'app/redux/region';
import { START_DISPLACEMENT } from 'app/redux/annualDisplacement';
import { RESET_EERE_INPUTS } from 'app/redux/eere';
export const RENDER_MONTHLY_EMISSIONS_CHARTS =
  'monthlyEmissions/RENDER_MONTHLY_EMISSIONS_CHARTS';
export const COMPLETE_MONTHLY_EMISSIONS =
  'monthlyEmissions/COMPLETE_MONTHLY_EMISSIONS';
export const SET_DOWNLOAD_DATA = 'monthlyEmissions/SET_DOWNLOAD_DATA';
export const SELECT_MONTHLY_AGGREGATION =
  'monthlyEmissions/SELECT_MONTHLY_AGGREGATION';
export const SELECT_MONTHLY_UNIT = 'monthlyEmissions/SELECT_MONTHLY_UNIT';
export const SELECT_MONTHLY_STATE = 'monthlyEmissions/SELECT_MONTHLY_STATE';
export const SELECT_MONTHLY_COUNTY = 'monthlyEmissions/SELECT_MONTHLY_COUNTY';
export const RESET_MONTHLY_EMISSIONS =
  'monthlyEmissions/RESET_MONTHLY_EMISSIONS';

type MonthlyAggregation = 'region' | 'state' | 'county';

type MonthlyUnit = 'emissions' | 'percentages';

type CountyDataRow = {
  Pollutant: 'SO2' | 'NOX' | 'CO2' | 'PM25';
  'Aggregation level': 'County' | 'State' | 'Region';
  State: string | null;
  County: string | null;
  'Unit of measure': 'emissions (pounds)' | 'emissions (tons)' | 'percent';
  January: number;
  February: number;
  March: number;
  April: number;
  May: number;
  June: number;
  July: number;
  August: number;
  September: number;
  October: number;
  November: number;
  December: number;
};

type CobraDataRow = {
  FIPS: string;
  STATE: string;
  COUNTY: string;
  TIER1NAME: string;
  NOx_REDUCTIONS_TONS: string;
  SO2_REDUCTIONS_TONS: string;
  PM25_REDUCTIONS_TONS: string;
};

type MonthlyEmissionsAction =
  | {
      type: typeof SELECT_REGION;
    }
  | {
      type: typeof START_DISPLACEMENT;
    }
  | {
      type: typeof RESET_EERE_INPUTS;
    }
  | {
      type: typeof RENDER_MONTHLY_EMISSIONS_CHARTS;
      so2: MonthlyChanges;
      nox: MonthlyChanges;
      co2: MonthlyChanges;
      pm25: MonthlyChanges;
    }
  | {
      type: typeof COMPLETE_MONTHLY_EMISSIONS;
      availableStates: string[];
    }
  | {
      type: typeof SET_DOWNLOAD_DATA;
      so2: MonthlyChanges;
      nox: MonthlyChanges;
      co2: MonthlyChanges;
      pm25: MonthlyChanges;
      statesAndCounties: {
        [stateId: string]: string[];
      };
    }
  | {
      type: typeof SELECT_MONTHLY_AGGREGATION;
      aggregation: MonthlyAggregation;
    }
  | {
      type: typeof SELECT_MONTHLY_UNIT;
      unit: MonthlyUnit;
    }
  | {
      type: typeof SELECT_MONTHLY_STATE;
      selectedState: string;
      availableCounties: string[];
    }
  | {
      type: typeof SELECT_MONTHLY_COUNTY;
      selectedCounty: string;
    }
  | {
      type: typeof RESET_MONTHLY_EMISSIONS;
    };

type MonthlyEmissionsState = {
  status: 'select_region' | 'ready' | 'started' | 'complete';
  aggregation: MonthlyAggregation;
  unit: MonthlyUnit;
  availableStates: string[];
  availableCounties: string[];
  selectedState: string;
  selectedCounty: string;
  output: {
    so2: number[];
    nox: number[];
    co2: number[];
    pm25: number[];
  };
  downloadableCountyData: CountyDataRow[];
  downloadableCobraData: CobraDataRow[];
};

export const useMonthlyEmissionsState: TypedUseSelectorHook<MonthlyEmissionsState> = useSelector;

// reducer
const initialState: MonthlyEmissionsState = {
  status: 'select_region',
  aggregation: 'region',
  unit: 'emissions',
  availableStates: [],
  availableCounties: [],
  selectedState: '',
  selectedCounty: '',
  output: {
    so2: [],
    nox: [],
    co2: [],
    pm25: [],
  },
  downloadableCountyData: [],
  downloadableCobraData: [],
};

export default function reducer(
  state = initialState,
  action: MonthlyEmissionsAction,
): MonthlyEmissionsState {
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
        availableStates: action.availableStates,
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

      const emissionData: {
        [pollutant in 'so2' | 'nox' | 'co2' | 'pm25']: number[];
      } = {
        so2: [],
        nox: [],
        co2: [],
        pm25: [],
      };

      // populate emissionData with data from action (pollutant data from store)
      (Object.keys(emissionData) as ('so2' | 'nox' | 'co2' | 'pm25')[]).forEach(
        (pollutant) => {
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
        },
      );

      return {
        ...state,
        output: emissionData,
      };

    case RESET_MONTHLY_EMISSIONS:
    case RESET_EERE_INPUTS:
      return initialState;

    case SET_DOWNLOAD_DATA:
      const countyData: CountyDataRow[] = [];
      const cobraData: CobraDataRow[] = [];

      //------ region data ------
      // add county data for each polutant, unit, and region
      countyData.push(countyRow('SO2', 'emissions (pounds)', action.so2.emissions.region)); // prettier-ignore
      countyData.push(countyRow('NOX', 'emissions (pounds)', action.nox.emissions.region)); // prettier-ignore
      countyData.push(countyRow('CO2', 'emissions (tons)', action.co2.emissions.region)); // prettier-ignore
      countyData.push(countyRow('PM25', 'emissions (pounds)', action.pm25.emissions.region)); // prettier-ignore
      countyData.push(countyRow('SO2', 'percent', action.so2.percentages.region)); // prettier-ignore
      countyData.push(countyRow('NOX', 'percent', action.nox.percentages.region)); // prettier-ignore
      countyData.push(countyRow('CO2', 'percent', action.co2.percentages.region)); // prettier-ignore
      countyData.push(countyRow('PM25', 'percent', action.pm25.percentages.region)); // prettier-ignore

      //------ states data ------
      // prettier-ignore
      Object.keys(action.statesAndCounties).forEach((s) => {
        // add county data for each polutant, unit, and state
        countyData.push(countyRow('SO2', 'emissions (pounds)', action.so2.emissions.state[s], s));
        countyData.push(countyRow('NOX', 'emissions (pounds)', action.nox.emissions.state[s], s));
        countyData.push(countyRow('CO2', 'emissions (tons)', action.co2.emissions.state[s], s));
        countyData.push(countyRow('PM25', 'emissions (pounds)', action.pm25.emissions.state[s], s));
        countyData.push(countyRow('SO2', 'percent', action.so2.percentages.state[s], s));
        countyData.push(countyRow('NOX', 'percent', action.nox.percentages.state[s], s));
        countyData.push(countyRow('CO2', 'percent', action.co2.percentages.state[s], s));
        countyData.push(countyRow('PM25', 'percent', action.pm25.percentages.state[s], s));

        //------ counties data ------
        action.statesAndCounties[s].forEach((c) => {
          // add county data for each polutant, unit, and county
          countyData.push(countyRow('SO2', 'emissions (pounds)', action.so2.emissions.county[s][c], s, c));
          countyData.push(countyRow('NOX', 'emissions (pounds)', action.nox.emissions.county[s][c], s, c));
          countyData.push(countyRow('CO2', 'emissions (tons)', action.co2.emissions.county[s][c], s, c));
          countyData.push(countyRow('PM25', 'emissions (pounds)', action.pm25.emissions.county[s][c], s, c));
          countyData.push(countyRow('SO2', 'percent', action.so2.percentages.county[s][c], s, c));
          countyData.push(countyRow('NOX', 'percent', action.nox.percentages.county[s][c], s, c));
          countyData.push(countyRow('CO2', 'percent', action.co2.percentages.county[s][c], s, c));
          countyData.push(countyRow('PM25', 'percent', action.pm25.percentages.county[s][c], s, c));

          // add cobra data for each county
          cobraData.push(cobraRow(s, c, action));
        });
      });

      return {
        ...state,
        downloadableCountyData: countyData,
        downloadableCobraData: cobraData,
      };

    default:
      return state;
  }
}

export const renderMonthlyEmissionsCharts = (): AppThunk => {
  return function (dispatch, getState) {
    // get reducer data from store to use in dispatched action
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

export const completeMonthlyEmissions = (): AppThunk => {
  return function (dispatch, getState) {
    // get reducer data from store to use in dispatched action
    const { annualDisplacement, so2, nox, co2, pm25 } = getState();

    dispatch({
      type: COMPLETE_MONTHLY_EMISSIONS,
      availableStates: Object.keys(annualDisplacement.statesAndCounties).sort(),
    });

    dispatch({
      type: SET_DOWNLOAD_DATA,
      so2: so2.data.monthlyChanges,
      nox: nox.data.monthlyChanges,
      co2: co2.data.monthlyChanges,
      pm25: pm25.data.monthlyChanges,
      statesAndCounties: annualDisplacement.statesAndCounties,
    });

    dispatch(renderMonthlyEmissionsCharts());
  };
};

export const selectMonthlyAggregation = (
  selection: MonthlyAggregation,
): AppThunk => {
  return function (dispatch) {
    dispatch({
      type: SELECT_MONTHLY_AGGREGATION,
      aggregation: selection,
    });
    dispatch(renderMonthlyEmissionsCharts());
  };
};

export const selectMonthlyUnit = (selection: MonthlyUnit): AppThunk => {
  return function (dispatch) {
    dispatch({
      type: SELECT_MONTHLY_UNIT,
      unit: selection,
    });
    dispatch(renderMonthlyEmissionsCharts());
  };
};

export const selectMonthlyState = (selection: string): AppThunk => {
  return function (dispatch, getState) {
    // get reducer data from store to use in dispatched action
    const { annualDisplacement } = getState();

    dispatch({
      type: SELECT_MONTHLY_STATE,
      selectedState: selection,
      availableCounties: annualDisplacement.statesAndCounties[selection].sort(),
    });
    dispatch(renderMonthlyEmissionsCharts());
  };
};

export const selectMonthlyCounty = (selection: string): AppThunk => {
  return function (dispatch) {
    dispatch({
      type: SELECT_MONTHLY_COUNTY,
      selectedCounty: selection,
    });
    dispatch(renderMonthlyEmissionsCharts());
  };
};

export const resetMonthlyEmissions = (): MonthlyEmissionsAction => ({
  type: RESET_MONTHLY_EMISSIONS,
});

/**
 * helper function to format downloadable county data rows
 */
function countyRow(
  pollutant: 'SO2' | 'NOX' | 'CO2' | 'PM25',
  unit: 'emissions (pounds)' | 'percent',
  data,
  state,
  county,
): CountyDataRow {
  data = Object.values(data);

  return {
    Pollutant: pollutant,
    'Aggregation level': county ? 'County' : state ? 'State' : 'Region',
    State: state ? state : null,
    County: county ? county : null,
    'Unit of measure': unit,
    January: data[0],
    February: data[1],
    March: data[2],
    April: data[3],
    May: data[4],
    June: data[5],
    July: data[6],
    August: data[7],
    September: data[8],
    October: data[9],
    November: data[10],
    December: data[11],
  };
}

/**
 * helper function to format cobra county data rows
 */
function cobraRow(
  state,
  county,
  action: { nox: MonthlyChanges; so2: MonthlyChanges; pm25: MonthlyChanges },
): CobraDataRow {
  const fipsCounty = FipsCodes.filter((item) => {
    return item['state'] === States[state] && item['county'] === county;
  })[0];

  const fipsCode = fipsCounty ? fipsCounty['code'] : '';

  const countyName =
    county.indexOf('(City)') !== -1
      ? county // county is really a city
      : state === 'LA'
      ? `${county} Parish`
      : `${county} County`;

  const noxData = action.nox.emissions.county[state][county];
  const so2Data = action.so2.emissions.county[state][county];
  const pm25Data = action.pm25.emissions.county[state][county];

  const sum = (a: number, b: number) => a + b;

  const noxDataTons = Object.values(noxData).reduce(sum, 0) / 2000;
  const so2DataTons = Object.values(so2Data).reduce(sum, 0) / 2000;
  const pm25DataTons = Object.values(pm25Data).reduce(sum, 0) / 2000;

  function formatNumber(number: number) {
    return number.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
  }

  return {
    FIPS: fipsCode,
    STATE: States[state],
    COUNTY: countyName,
    TIER1NAME: 'FUEL COMB. ELEC. UTIL.',
    NOx_REDUCTIONS_TONS: formatNumber(noxDataTons),
    SO2_REDUCTIONS_TONS: formatNumber(so2DataTons),
    PM25_REDUCTIONS_TONS: formatNumber(pm25DataTons),
  };
}
