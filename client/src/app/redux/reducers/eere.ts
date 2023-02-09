import { AppThunk } from 'app/redux/index';
import {
  RegionalLoadData,
  RegionState,
  StateState,
} from 'app/redux/reducers/geography';
import {
  setEVEfficiency,
  setVehiclesDisplaced,
  setMonthlyEVEnergyUsage,
  setMonthlyEmissionRates,
  setVehicleSalesAndStock,
  setEVDeploymentLocationHistoricalEERE,
} from 'app/redux/reducers/transportation';
import type { HourlyImpacts } from 'app/calculations/eere';
import {
  calculateHourlyRenewableEnergyProfile,
  calculateHourlyEVLoad,
  calculateTopPercentGeneration,
  calculateHourlyTopPercentReduction,
  calculateHourlyImpacts,
} from 'app/calculations/eere';
import { calculateEere } from 'app/calculations';
import type { RegionId, StateId } from 'app/config';
import {
  regions,
  evModelYearOptions,
  iceReplacementVehicleOptions,
} from 'app/config';

type RegionalProfile = {
  regionId: RegionId;
  hourlyEere: number[];
  softValid: boolean;
  softTopExceedanceValue: number;
  softTopExceedanceIndex: number;
  hardValid: boolean;
  hardTopExceedanceValue: number;
  hardTopExceedanceIndex: number;
};

type CombinedProfile = {
  hourlyEere: number[];
  softValid: boolean;
  softTopExceedanceValue: number;
  softTopExceedanceTimestamp: RegionalLoadData;
  hardValid: boolean;
  hardTopExceedanceValue: number;
  hardTopExceedanceTimestamp: RegionalLoadData;
};

type SelectOption = { id: string; name: string };

type EereAction =
  | { type: 'eere/RESET_EERE_INPUTS' }
  | {
      type: 'eere/SET_EV_DEPLOYMENT_LOCATION_OPTIONS';
      payload: { evDeploymentLocationOptions: SelectOption[] };
    }
  | {
      type: 'eere/VALIDATE_EERE';
      payload: {
        errors: (
          | EnergyEfficiencyFieldName
          | RenewableEnergyFieldName
          | ElectricVehiclesFieldName
        )[];
      };
    }
  | {
      type: 'eere/UPDATE_EERE_ANNUAL_GWH';
      payload: { text: string };
    }
  | {
      type: 'eere/UPDATE_EERE_CONSTANT_MW';
      payload: { text: string };
    }
  | {
      type: 'eere/UPDATE_EERE_BROAD_BASE_PROGRAM';
      payload: { text: string };
    }
  | {
      type: 'eere/UPDATE_EERE_REDUCTION';
      payload: { text: string };
    }
  | {
      type: 'eere/UPDATE_EERE_TOP_HOURS';
      payload: { text: string };
    }
  | {
      type: 'eere/UPDATE_EERE_ONSHORE_WIND';
      payload: { text: string };
    }
  | {
      type: 'eere/UPDATE_EERE_OFFSHORE_WIND';
      payload: { text: string };
    }
  | {
      type: 'eere/UPDATE_EERE_UTILITY_SOLAR';
      payload: { text: string };
    }
  | {
      type: 'eere/UPDATE_EERE_ROOFTOP_SOLAR';
      payload: { text: string };
    }
  | {
      type: 'eere/UPDATE_EERE_BATTERY_EVS';
      payload: { text: string };
    }
  | {
      type: 'eere/UPDATE_EERE_BATTERY_EVS_CALCULATIONS_INPUT';
      payload: { text: string };
    }
  | {
      type: 'eere/UPDATE_EERE_HYBRID_EVS';
      payload: { text: string };
    }
  | {
      type: 'eere/UPDATE_EERE_HYBRID_EVS_CALCULATIONS_INPUT';
      payload: { text: string };
    }
  | {
      type: 'eere/UPDATE_EERE_TRANSIT_BUSES';
      payload: { text: string };
    }
  | {
      type: 'eere/UPDATE_EERE_TRANSIT_BUSES_CALCULATIONS_INPUT';
      payload: { text: string };
    }
  | {
      type: 'eere/UPDATE_EERE_SCHOOL_BUSES';
      payload: { text: string };
    }
  | {
      type: 'eere/UPDATE_EERE_SCHOOL_BUSES_CALCULATIONS_INPUT';
      payload: { text: string };
    }
  | {
      type: 'eere/UPDATE_EERE_EV_DEPLOYMENT_LOCATION';
      payload: { option: string };
    }
  | {
      type: 'eere/UPDATE_EERE_EV_MODEL_YEAR';
      payload: { option: string };
    }
  | {
      type: 'eere/UPDATE_EERE_ICE_REPLACEMENT_VEHICLE';
      payload: { option: string };
    }
  | {
      type: 'eere/START_EERE_PROFILE_CALCULATIONS';
      payload: { profileCalculationInputs: EEREInputs };
    }
  | {
      type: 'eere/CALCULATE_REGIONAL_HOURLY_IMPACTS';
      payload: {
        regionId: RegionId;
        hourlyImpacts: HourlyImpacts;
      };
    }
  | {
      type: 'eere/CALCULATE_REGIONAL_EERE_PROFILE';
      payload: RegionalProfile;
    }
  | {
      type: 'eere/COMPLETE_EERE_PROFILE_CALCULATIONS';
      payload: CombinedProfile;
    };

export type EnergyEfficiencyFieldName =
  | 'annualGwh'
  | 'constantMwh'
  | 'broadProgram'
  | 'reduction'
  | 'topHours';

export type RenewableEnergyFieldName =
  | 'onshoreWind'
  | 'offshoreWind'
  | 'utilitySolar'
  | 'rooftopSolar';

export type ElectricVehiclesFieldName =
  | 'batteryEVs'
  | 'hybridEVs'
  | 'transitBuses'
  | 'schoolBuses';

type SelectOptionsFieldName =
  | 'evDeploymentLocationOptions'
  | 'evModelYearOptions'
  | 'iceReplacementVehicleOptions';

export type EEREInputs = {
  [field in
    | EnergyEfficiencyFieldName
    | RenewableEnergyFieldName
    | ElectricVehiclesFieldName
    | 'evDeploymentLocation'
    | 'evModelYear'
    | 'iceReplacementVehicle']: string;
};

type EereState = {
  errors: (
    | EnergyEfficiencyFieldName
    | RenewableEnergyFieldName
    | ElectricVehiclesFieldName
  )[];
  inputs: EEREInputs;
  selectOptions: { [field in SelectOptionsFieldName]: SelectOption[] };
  evCalculationsInputs: { [field in ElectricVehiclesFieldName]: string };
  profileCalculationStatus: 'idle' | 'pending' | 'success';
  profileCalculationInputs: EEREInputs;
  regionalHourlyImpacts: Partial<{ [key in RegionId]: HourlyImpacts }>;
  regionalProfiles: Partial<{ [key in RegionId]: RegionalProfile }>;
  combinedProfile: CombinedProfile;
};

/** NOTE: Excel version defaults EV model year to 2021 */
const initialEVModelYear = evModelYearOptions[1].id;

const initialICEReplacementVehicle = iceReplacementVehicleOptions[0].id;

const initialEEREInputs = {
  annualGwh: '',
  constantMwh: '',
  broadProgram: '',
  reduction: '',
  topHours: '',
  onshoreWind: '',
  offshoreWind: '',
  utilitySolar: '',
  rooftopSolar: '',
  batteryEVs: '',
  hybridEVs: '',
  transitBuses: '',
  schoolBuses: '',
  evDeploymentLocation: '',
  evModelYear: initialEVModelYear,
  iceReplacementVehicle: initialICEReplacementVehicle,
};

const emptyRegionalLoadHour = {
  hour_of_year: 0,
  year: 0,
  month: 0,
  day: 0,
  hour: 0,
  regional_load_mw: 0,
  hourly_limit: 0,
};

const initialState: EereState = {
  errors: [],
  inputs: initialEEREInputs,
  selectOptions: {
    evDeploymentLocationOptions: [{ id: '', name: '' }],
    evModelYearOptions,
    iceReplacementVehicleOptions,
  },
  evCalculationsInputs: {
    batteryEVs: '',
    hybridEVs: '',
    transitBuses: '',
    schoolBuses: '',
  },
  profileCalculationStatus: 'idle',
  profileCalculationInputs: initialEEREInputs,
  regionalHourlyImpacts: {},
  regionalProfiles: {},
  combinedProfile: {
    hourlyEere: [],
    softValid: true,
    softTopExceedanceValue: 0,
    softTopExceedanceTimestamp: emptyRegionalLoadHour,
    hardValid: true,
    hardTopExceedanceValue: 0,
    hardTopExceedanceTimestamp: emptyRegionalLoadHour,
  },
};

export default function reducer(
  state: EereState = initialState,
  action: EereAction,
): EereState {
  switch (action.type) {
    case 'eere/RESET_EERE_INPUTS': {
      // initial state, excluding for selectOptions
      return {
        ...state,
        errors: [],
        inputs: initialEEREInputs,
        // NOTE: selectOptions should not be reset
        evCalculationsInputs: {
          batteryEVs: '',
          hybridEVs: '',
          transitBuses: '',
          schoolBuses: '',
        },
        profileCalculationStatus: 'idle',
        profileCalculationInputs: initialEEREInputs,
        regionalProfiles: {},
        combinedProfile: {
          hourlyEere: [],
          softValid: true,
          softTopExceedanceValue: 0,
          softTopExceedanceTimestamp: emptyRegionalLoadHour,
          hardValid: true,
          hardTopExceedanceValue: 0,
          hardTopExceedanceTimestamp: emptyRegionalLoadHour,
        },
      };
    }

    case 'eere/SET_EV_DEPLOYMENT_LOCATION_OPTIONS': {
      const { evDeploymentLocationOptions } = action.payload;
      return {
        ...state,
        selectOptions: {
          ...state.selectOptions,
          evDeploymentLocationOptions,
        },
      };
    }

    case 'eere/VALIDATE_EERE': {
      const { errors } = action.payload;
      return {
        ...state,
        errors,
      };
    }

    case 'eere/UPDATE_EERE_ANNUAL_GWH': {
      const { text } = action.payload;
      return {
        ...state,
        inputs: {
          ...state.inputs,
          annualGwh: text,
        },
      };
    }

    case 'eere/UPDATE_EERE_CONSTANT_MW': {
      const { text } = action.payload;
      return {
        ...state,
        inputs: {
          ...state.inputs,
          constantMwh: text,
        },
      };
    }

    case 'eere/UPDATE_EERE_BROAD_BASE_PROGRAM': {
      const { text } = action.payload;
      return {
        ...state,
        inputs: {
          ...state.inputs,
          broadProgram: text,
        },
      };
    }

    case 'eere/UPDATE_EERE_REDUCTION': {
      const { text } = action.payload;
      return {
        ...state,
        inputs: {
          ...state.inputs,
          reduction: text,
        },
      };
    }

    case 'eere/UPDATE_EERE_TOP_HOURS': {
      const { text } = action.payload;
      return {
        ...state,
        inputs: {
          ...state.inputs,
          topHours: text,
        },
      };
    }

    case 'eere/UPDATE_EERE_ONSHORE_WIND': {
      const { text } = action.payload;
      return {
        ...state,
        inputs: {
          ...state.inputs,
          onshoreWind: text,
        },
      };
    }

    case 'eere/UPDATE_EERE_OFFSHORE_WIND': {
      const { text } = action.payload;
      return {
        ...state,
        inputs: {
          ...state.inputs,
          offshoreWind: text,
        },
      };
    }

    case 'eere/UPDATE_EERE_UTILITY_SOLAR': {
      const { text } = action.payload;
      return {
        ...state,
        inputs: {
          ...state.inputs,
          utilitySolar: text,
        },
      };
    }

    case 'eere/UPDATE_EERE_ROOFTOP_SOLAR': {
      const { text } = action.payload;
      return {
        ...state,
        inputs: {
          ...state.inputs,
          rooftopSolar: text,
        },
      };
    }

    case 'eere/UPDATE_EERE_BATTERY_EVS': {
      const { text } = action.payload;
      return {
        ...state,
        inputs: {
          ...state.inputs,
          batteryEVs: text,
        },
      };
    }

    case 'eere/UPDATE_EERE_BATTERY_EVS_CALCULATIONS_INPUT': {
      const { text } = action.payload;
      return {
        ...state,
        evCalculationsInputs: {
          ...state.evCalculationsInputs,
          batteryEVs: text,
        },
      };
    }

    case 'eere/UPDATE_EERE_HYBRID_EVS': {
      const { text } = action.payload;
      return {
        ...state,
        inputs: {
          ...state.inputs,
          hybridEVs: text,
        },
      };
    }

    case 'eere/UPDATE_EERE_HYBRID_EVS_CALCULATIONS_INPUT': {
      const { text } = action.payload;
      return {
        ...state,
        evCalculationsInputs: {
          ...state.evCalculationsInputs,
          hybridEVs: text,
        },
      };
    }

    case 'eere/UPDATE_EERE_TRANSIT_BUSES': {
      const { text } = action.payload;
      return {
        ...state,
        inputs: {
          ...state.inputs,
          transitBuses: text,
        },
      };
    }

    case 'eere/UPDATE_EERE_TRANSIT_BUSES_CALCULATIONS_INPUT': {
      const { text } = action.payload;
      return {
        ...state,
        evCalculationsInputs: {
          ...state.evCalculationsInputs,
          transitBuses: text,
        },
      };
    }

    case 'eere/UPDATE_EERE_SCHOOL_BUSES': {
      const { text } = action.payload;
      return {
        ...state,
        inputs: {
          ...state.inputs,
          schoolBuses: text,
        },
      };
    }

    case 'eere/UPDATE_EERE_SCHOOL_BUSES_CALCULATIONS_INPUT': {
      const { text } = action.payload;
      return {
        ...state,
        evCalculationsInputs: {
          ...state.evCalculationsInputs,
          schoolBuses: text,
        },
      };
    }

    case 'eere/UPDATE_EERE_EV_DEPLOYMENT_LOCATION': {
      const { option } = action.payload;
      return {
        ...state,
        inputs: {
          ...state.inputs,
          evDeploymentLocation: option,
        },
      };
    }

    case 'eere/UPDATE_EERE_EV_MODEL_YEAR': {
      const { option } = action.payload;
      return {
        ...state,
        inputs: {
          ...state.inputs,
          evModelYear: option,
        },
      };
    }

    case 'eere/UPDATE_EERE_ICE_REPLACEMENT_VEHICLE': {
      const { option } = action.payload;
      return {
        ...state,
        inputs: {
          ...state.inputs,
          iceReplacementVehicle: option,
        },
      };
    }

    case 'eere/START_EERE_PROFILE_CALCULATIONS': {
      const { profileCalculationInputs } = action.payload;
      return {
        ...state,
        profileCalculationStatus: 'pending',
        profileCalculationInputs,
        regionalProfiles: {},
      };
    }

    case 'eere/CALCULATE_REGIONAL_EERE_PROFILE': {
      const {
        regionId,
        hourlyEere,
        softValid,
        softTopExceedanceValue,
        softTopExceedanceIndex,
        hardValid,
        hardTopExceedanceValue,
        hardTopExceedanceIndex,
      } = action.payload;
      return {
        ...state,
        regionalProfiles: {
          ...state.regionalProfiles,
          [regionId]: {
            hourlyEere,
            softValid,
            softTopExceedanceValue,
            softTopExceedanceIndex,
            hardValid,
            hardTopExceedanceValue,
            hardTopExceedanceIndex,
          },
        },
      };
    }

    case 'eere/CALCULATE_REGIONAL_HOURLY_IMPACTS': {
      const { regionId, hourlyImpacts } = action.payload;

      return {
        ...state,
        regionalHourlyImpacts: {
          ...state.regionalHourlyImpacts,
          [regionId]: hourlyImpacts,
        },
      };
    }

    case 'eere/COMPLETE_EERE_PROFILE_CALCULATIONS': {
      const combinedProfile = action.payload;
      return {
        ...state,
        profileCalculationStatus: 'success',
        combinedProfile,
      };
    }

    default: {
      return state;
    }
  }
}

/**
 * Called every time the `geography` reducer's `selectGeography()`,
 * `selectRegion()`, or `selectState()` function is called.
 *
 * _(e.g. anytime the selected geography changes)_
 */
export function setEVDeploymentLocationOptions(): AppThunk {
  return (dispatch, getState) => {
    const { geography } = getState();
    const { focus, regions, states } = geography;

    const selectedRegion = Object.values(regions).find((r) => r.selected);
    const selectedState = Object.values(states).find((s) => s.selected);

    const evDeploymentLocationOptions =
      focus === 'regions' && selectedRegion
        ? [
            {
              id: `region-${selectedRegion.id}`,
              name: `${selectedRegion.name} Region`,
            },
            ...Object.keys(selectedRegion.percentageByState).map((id) => ({
              id: `state-${id}`,
              name: states[id as StateId].name || id,
            })),
          ]
        : focus === 'states' && selectedState
        ? [
            {
              id: `state-${selectedState.id}`,
              name: `${selectedState.name}`,
            },
          ]
        : [{ id: '', name: '' }];

    dispatch({
      type: 'eere/SET_EV_DEPLOYMENT_LOCATION_OPTIONS',
      payload: { evDeploymentLocationOptions },
    });

    // NOTE: `vehicleSalesAndStock` uses `evDeploymentLocationOptions`
    dispatch(setVehicleSalesAndStock());
  };
}

function validateInput(
  inputField:
    | EnergyEfficiencyFieldName
    | RenewableEnergyFieldName
    | ElectricVehiclesFieldName,
  inputValue: string,
): AppThunk {
  return (dispatch, getState) => {
    const { eere } = getState();

    const value = Number(inputValue);
    const invalidInput = isNaN(value) || value < 0;

    // remove input field being validated from existing fields with errors
    const errors = eere.errors.filter((field) => field !== inputField);

    return dispatch({
      type: 'eere/VALIDATE_EERE',
      payload: {
        errors: invalidInput ? [...errors, inputField] : errors,
      },
    });
  };
}

export function updateEereAnnualGwh(input: string): AppThunk {
  return (dispatch) => {
    dispatch({
      type: 'eere/UPDATE_EERE_ANNUAL_GWH',
      payload: { text: input },
    });

    dispatch(validateInput('annualGwh', input));
  };
}

export function updateEereConstantMw(input: string): AppThunk {
  return (dispatch) => {
    dispatch({
      type: 'eere/UPDATE_EERE_CONSTANT_MW',
      payload: { text: input },
    });

    dispatch(validateInput('constantMwh', input));
  };
}

export function updateEereBroadBasedProgram(input: string): AppThunk {
  return (dispatch) => {
    dispatch({
      type: 'eere/UPDATE_EERE_BROAD_BASE_PROGRAM',
      payload: { text: input },
    });

    dispatch(validateInput('broadProgram', input));
  };
}

export function updateEereReduction(input: string): AppThunk {
  return (dispatch) => {
    dispatch({
      type: 'eere/UPDATE_EERE_REDUCTION',
      payload: { text: input },
    });

    dispatch(validateInput('reduction', input));
  };
}

export function updateEereTopHours(input: string): AppThunk {
  return (dispatch) => {
    dispatch({
      type: 'eere/UPDATE_EERE_TOP_HOURS',
      payload: { text: input },
    });

    dispatch(validateInput('topHours', input));
  };
}

export function updateEereOnshoreWind(input: string): AppThunk {
  return (dispatch) => {
    dispatch({
      type: 'eere/UPDATE_EERE_ONSHORE_WIND',
      payload: { text: input },
    });

    dispatch(validateInput('onshoreWind', input));
  };
}

export function updateEereOffshoreWind(input: string): AppThunk {
  return (dispatch) => {
    dispatch({
      type: 'eere/UPDATE_EERE_OFFSHORE_WIND',
      payload: { text: input },
    });

    dispatch(validateInput('offshoreWind', input));
  };
}

export function updateEereUtilitySolar(input: string): AppThunk {
  return (dispatch) => {
    dispatch({
      type: 'eere/UPDATE_EERE_UTILITY_SOLAR',
      payload: { text: input },
    });

    dispatch(validateInput('utilitySolar', input));
  };
}

export function updateEereRooftopSolar(input: string): AppThunk {
  return (dispatch) => {
    dispatch({
      type: 'eere/UPDATE_EERE_ROOFTOP_SOLAR',
      payload: { text: input },
    });

    dispatch(validateInput('rooftopSolar', input));
  };
}

export function updateEereBatteryEVs(input: string): AppThunk {
  return (dispatch) => {
    dispatch({
      type: 'eere/UPDATE_EERE_BATTERY_EVS',
      payload: { text: input },
    });

    dispatch(validateInput('batteryEVs', input));
  };
}

/**
 * Called every time the batteryEVs inputs loses focus (e.g. onBlur)
 */
export function runEereBatteryEVsCalculations(input: string): AppThunk {
  return (dispatch, getState) => {
    const { eere } = getState();
    const { batteryEVs } = eere.evCalculationsInputs;

    /** only run calculations if the input has changed since the last onBlur */
    if (input !== batteryEVs) {
      dispatch(setVehiclesDisplaced());
    }

    dispatch({
      type: 'eere/UPDATE_EERE_BATTERY_EVS_CALCULATIONS_INPUT',
      payload: { text: input },
    });
  };
}

export function updateEereHybridEVs(input: string): AppThunk {
  return (dispatch) => {
    dispatch({
      type: 'eere/UPDATE_EERE_HYBRID_EVS',
      payload: { text: input },
    });

    dispatch(validateInput('hybridEVs', input));
  };
}

/**
 * Called every time the hybridEVs inputs loses focus (e.g. onBlur)
 */
export function runEereHybridEVsCalculations(input: string): AppThunk {
  return (dispatch, getState) => {
    const { eere } = getState();
    const { hybridEVs } = eere.evCalculationsInputs;

    /** only run calculations if the input has changed since the last onBlur */
    if (input !== hybridEVs) {
      dispatch(setVehiclesDisplaced());
    }

    dispatch({
      type: 'eere/UPDATE_EERE_HYBRID_EVS_CALCULATIONS_INPUT',
      payload: { text: input },
    });
  };
}

export function updateEereTransitBuses(input: string): AppThunk {
  return (dispatch) => {
    dispatch({
      type: 'eere/UPDATE_EERE_TRANSIT_BUSES',
      payload: { text: input },
    });

    dispatch(validateInput('transitBuses', input));
  };
}

/**
 * Called every time the transitBuses inputs loses focus (e.g. onBlur)
 */
export function runEereTransitBusesCalculations(input: string): AppThunk {
  return (dispatch, getState) => {
    const { eere } = getState();
    const { transitBuses } = eere.evCalculationsInputs;

    /** only run calculations if the input has changed since the last onBlur */
    if (input !== transitBuses) {
      dispatch(setVehiclesDisplaced());
    }

    dispatch({
      type: 'eere/UPDATE_EERE_TRANSIT_BUSES_CALCULATIONS_INPUT',
      payload: { text: input },
    });
  };
}

export function updateEereSchoolBuses(input: string): AppThunk {
  return (dispatch) => {
    dispatch({
      type: 'eere/UPDATE_EERE_SCHOOL_BUSES',
      payload: { text: input },
    });

    dispatch(validateInput('schoolBuses', input));
  };
}

/**
 * Called every time the schoolBuses inputs loses focus (e.g. onBlur)
 */
export function runEereSchoolBusesCalculations(input: string): AppThunk {
  return (dispatch, getState) => {
    const { eere } = getState();
    const { schoolBuses } = eere.evCalculationsInputs;

    /** only run calculations if the input has changed since the last onBlur */
    if (input !== schoolBuses) {
      dispatch(setVehiclesDisplaced());
    }

    dispatch({
      type: 'eere/UPDATE_EERE_SCHOOL_BUSES_CALCULATIONS_INPUT',
      payload: { text: input },
    });
  };
}

export function updateEereEVDeploymentLocation(input: string): AppThunk {
  return (dispatch) => {
    dispatch({
      type: 'eere/UPDATE_EERE_EV_DEPLOYMENT_LOCATION',
      payload: { option: input },
    });

    dispatch(setMonthlyEmissionRates());
    dispatch(setEVDeploymentLocationHistoricalEERE());
  };
}

export function updateEereEVModelYear(input: string): AppThunk {
  return (dispatch) => {
    dispatch({
      type: 'eere/UPDATE_EERE_EV_MODEL_YEAR',
      payload: { option: input },
    });

    dispatch(setEVEfficiency());
    dispatch(setMonthlyEVEnergyUsage());
    dispatch(setMonthlyEmissionRates());
  };
}

export function updateEereICEReplacementVehicle(input: string): AppThunk {
  return (dispatch) => {
    dispatch({
      type: 'eere/UPDATE_EERE_ICE_REPLACEMENT_VEHICLE',
      payload: { option: input },
    });

    dispatch(setMonthlyEmissionRates());
  };
}

export function calculateEereProfile(): AppThunk {
  return (dispatch, getState) => {
    const { geography, transportation, eere } = getState();
    const { regionalScalingFactors } = geography;
    const {
      dailyStats,
      hourlyEVChargingPercentages,
      monthlyDailyEVEnergyUsage,
    } = transportation;
    const { inputs } = eere;

    // select region(s), based on geographic focus:
    // single region if geographic focus is 'regions'
    // multiple regions if geographic focus is 'states'
    const selectedRegions: RegionState[] = [];

    let selectedState: StateState | undefined;

    if (geography.focus === 'regions') {
      for (const regionId in geography.regions) {
        const region = geography.regions[regionId as RegionId];
        if (region.selected) {
          selectedRegions.push(region);
        }
      }
    }

    if (geography.focus === 'states') {
      for (const stateId in geography.states) {
        const state = geography.states[stateId as StateId];
        if (state.selected) {
          selectedState = state;
          Object.keys(state.percentageByRegion).forEach((regionId) => {
            const region = geography.regions[regionId as RegionId];
            selectedRegions.push(region);
          });
        }
      }
    }

    dispatch({
      type: 'eere/START_EERE_PROFILE_CALCULATIONS',
      payload: { profileCalculationInputs: inputs },
    });

    // selected regional profiles are stored individually to pass to the
    // displacements calculation, and also combined for all selected regions to
    // create the eere profile chart and show validation warning/error message
    const selectedRegionalProfiles: RegionalProfile[] = [];

    // build up total percentage of selected state in all selected regions that
    // support offshore wind
    const totalOffshoreWindPercent = selectedRegions.reduce((total, region) => {
      const regionalPercent = selectedState?.percentageByRegion[region.id] || 0;
      return region.offshoreWind ? (total += regionalPercent) : total;
    }, 0);

    selectedRegions.forEach((region) => {
      const regionalLoad = region.rdf.regional_load;
      const lineLoss = region.lineLoss;
      const eereDefaults = region.eereDefaults.data;

      const regionalPercent = selectedState?.percentageByRegion[region.id] || 0;

      // the regional scaling factor is a number between 0 and 1, representing
      // the proportion the selected geography exists within a given region.
      // - if a region is selected, the regional scaling factor will always be 1
      // - if a state is selected, the regional scaling factor comes from the
      //   selected state's percentage by region value for the given region, as
      //   defined in the config file (`app/config.ts`). for example, if the
      //   state falls exactly equally between the two regions, the regional
      //   scaling factor would be 0.5 for each of those two regions.
      const regionalScalingFactor = regionalScalingFactors[region.id] || 0;

      // the percent reduction factor also is a number between 0 and 1, and
      // is used to scale the user's input for broad-based program reduction
      // (percent reduction across all hours) or targed program reduction
      // (percent reduction across a specified peak percentage of hours) to
      // each region, since a selected state represents only a percentage of
      // a region's emissions sales
      // - if a region is selected, the percent reduction factor will always be 1
      // - if a state is selected, the percent reduction factor comes from the
      //   given region's percentage by state value for the selected state, as
      //   defined in the config file (`app/config.ts`)
      const percentReductionFactor = !selectedState
        ? 1
        : (regions[region.id].percentageByState[selectedState?.id] || 0) / 100;

      // the offshore wind factor is also a number between 0 and 1, representing
      // the proportion the selected geography's offshore wind value should be
      // allocated to each region. regions either support offshore wind or they
      // don't, and some states are within at least one region that supports it,
      // and at least one region that doesn't.
      // - if a region is selected, the offshore wind factor will always be 1
      //   (if the region doesn't support offshore wind, the input will be
      //   disabled and 0 will be used in the calculations for offshore wind –
      //   see `app/calculations.ts`)
      // - if a is state is selected and it's within a region that supports
      //   offshore wind, the offshore wind factor will be set to an integer
      //   equal to the proportion the state exists within the region divided
      //   by the proprtion the state exists within all regions that support
      //   offshore wind
      // - if a state is selected and it's within a region that doesn't support
      //   offshore wind, the offshore wind factor will always be 0
      //
      // for example:
      // Kentucky is selected...it's within the Tennessee, Mid-Atlantic, and
      // Midwest regions, but only the Mid-Atlantic region supports offshore
      // wind. so the Tennessee and Midwest regions' `offshoreWindFactor` would
      // be 0, and the Mid-Atlantic region's `offshoreWindFactor` would be 1
      const offshoreWindFactor = !selectedState
        ? 1
        : region.offshoreWind
        ? regionalPercent / totalOffshoreWindPercent
        : 0;

      const annualGwh = Number(inputs.annualGwh) * regionalScalingFactor;
      const constantMwh = Number(inputs.constantMwh) * regionalScalingFactor;
      const broadProgram = Number(inputs.broadProgram) * percentReductionFactor;
      const reduction = Number(inputs.reduction) * percentReductionFactor;
      const topHours = Number(inputs.topHours);
      const onshoreWind = Number(inputs.onshoreWind) * regionalScalingFactor;
      const offshoreWind = Number(inputs.offshoreWind) * offshoreWindFactor;
      const utilitySolar = Number(inputs.utilitySolar) * regionalScalingFactor;
      const rooftopSolar = Number(inputs.rooftopSolar) * regionalScalingFactor;

      const hourlyRenewableEnergyProfile =
        calculateHourlyRenewableEnergyProfile({
          eereDefaults,
          lineLoss,
          onshoreWind,
          offshoreWind,
          utilitySolar,
          rooftopSolar,
        });

      const hourlyEVLoad = calculateHourlyEVLoad({
        regionalLoad,
        dailyStats,
        hourlyEVChargingPercentages,
        monthlyDailyEVEnergyUsage,
      });

      const topPercentGeneration = calculateTopPercentGeneration({
        regionalLoad,
        broadProgram,
        topHours,
      });

      const hourlyTopPercentReduction = calculateHourlyTopPercentReduction({
        regionalLoad,
        topPercentGeneration,
        broadProgram,
        reduction,
      });

      const hourlyImpacts = calculateHourlyImpacts({
        lineLoss,
        regionalLoad,
        hourlyRenewableEnergyProfile,
        hourlyEVLoad,
        hourlyTopPercentReduction,
        annualGwh,
        constantMwh,
      });

      dispatch({
        type: 'eere/CALCULATE_REGIONAL_HOURLY_IMPACTS',
        payload: {
          regionId: region.id,
          hourlyImpacts,
        },
      });

      const {
        hourlyEere,
        softValid,
        softTopExceedanceValue,
        softTopExceedanceIndex,
        hardValid,
        hardTopExceedanceValue,
        hardTopExceedanceIndex,
      } = calculateEere({
        lineLoss,
        regionalLoad,
        hourlyRenewableEnergyProfile,
        hourlyEVLoad,
        hourlyTopPercentReduction,
        annualGwh,
        constantMwh,
      });

      const regionalProfile = {
        regionId: region.id,
        hourlyEere,
        softValid,
        softTopExceedanceValue,
        softTopExceedanceIndex,
        hardValid,
        hardTopExceedanceValue,
        hardTopExceedanceIndex,
      };

      selectedRegionalProfiles.push(regionalProfile);

      dispatch({
        type: 'eere/CALCULATE_REGIONAL_EERE_PROFILE',
        payload: regionalProfile,
      });
    });

    // construct an object of properties from selectedRegionalProfiles, so we
    // don't need to map over it multiple times to work with each property
    const profiles = {
      regionIds: [] as RegionId[],
      hourlyEeres: [] as number[][],
      softValids: [] as boolean[],
      softTopExceedanceVals: [] as number[],
      softTopExceedanceIdxs: [] as number[],
      hardValids: [] as boolean[],
      hardTopExceedanceVals: [] as number[],
      hardTopExceedanceIdxs: [] as number[],
    };

    selectedRegionalProfiles.forEach((p) => {
      profiles.regionIds.push(p.regionId);
      profiles.hourlyEeres.push(p.hourlyEere);
      profiles.softValids.push(p.softValid);
      profiles.softTopExceedanceVals.push(p.softTopExceedanceValue);
      profiles.softTopExceedanceIdxs.push(p.softTopExceedanceIndex);
      profiles.hardValids.push(p.hardValid);
      profiles.hardTopExceedanceVals.push(p.hardTopExceedanceValue);
      profiles.hardTopExceedanceIdxs.push(p.hardTopExceedanceIndex);
    });

    // add up hourly eeres from each selected region into one hourlyEere array
    const combinedHourlyEeres = profiles.hourlyEeres.reduce(
      (combinedHourlyEere, regionalHourlyEere) => {
        return combinedHourlyEere.map((hourlyLoad, index) => {
          return hourlyLoad + regionalHourlyEere[index];
        });
      },
    );

    // if one region's not valid, the combined profile is not valid
    const softValid = profiles.softValids.every((isValid) => isValid);
    const hardValid = profiles.hardValids.every((isValid) => isValid);

    // if a region is invalid...
    //   get the first hour of exceedance across all of the selected regions
    // else, a region is valid...
    //   so use the first index value
    const softTopExceedanceIdx = !softValid
      ? Math.min(...profiles.softTopExceedanceIdxs.filter((d) => d !== -1))
      : profiles.softTopExceedanceIdxs[0];
    const hardTopExceedanceIdx = !hardValid
      ? Math.min(...profiles.hardTopExceedanceIdxs.filter((d) => d !== -1))
      : profiles.hardTopExceedanceIdxs[0];

    // get the index of that first hour of exceedance in the profiles object in
    // order to get the corresponding top value and corresponding region id
    const sIdx = profiles.softTopExceedanceIdxs.indexOf(softTopExceedanceIdx);
    const hIdx = profiles.hardTopExceedanceIdxs.indexOf(hardTopExceedanceIdx);

    // get the corresponding value from that first hour of exceedance
    const softTopExceedanceValue = profiles.softTopExceedanceVals[sIdx];
    const hardTopExceedanceValue = profiles.hardTopExceedanceVals[hIdx];

    // get the corresponding region id from the first hour of exceedance
    const softRegionId = profiles.regionIds[sIdx];
    const hardRegionId = profiles.regionIds[hIdx];

    // get the timestamp of the first hour of exceedance
    const softTopExceedanceTimestamp = !softValid
      ? geography.regions[softRegionId].rdf.regional_load[softTopExceedanceIdx]
      : emptyRegionalLoadHour;

    const hardTopExceedanceTimestamp = !hardValid
      ? geography.regions[hardRegionId].rdf.regional_load[hardTopExceedanceIdx]
      : emptyRegionalLoadHour;

    dispatch({
      type: 'eere/COMPLETE_EERE_PROFILE_CALCULATIONS',
      payload: {
        hourlyEere: combinedHourlyEeres,
        softValid,
        softTopExceedanceValue,
        softTopExceedanceTimestamp,
        hardValid,
        hardTopExceedanceValue,
        hardTopExceedanceTimestamp,
      },
    });
  };
}

export function resetEEREInputs(): AppThunk {
  return (dispatch, getState) => {
    const { eere } = getState();
    const { evDeploymentLocationOptions } = eere.selectOptions;

    const evDeploymentLocation = evDeploymentLocationOptions[0].id;
    const evModelYear = initialEVModelYear;
    const iceReplacementVehicle = initialICEReplacementVehicle;

    dispatch({ type: 'eere/RESET_EERE_INPUTS' });

    // re-run dependant transportation calculations after resetting EV inputs
    dispatch(setVehiclesDisplaced());

    dispatch(updateEereEVDeploymentLocation(evDeploymentLocation));
    dispatch(updateEereEVModelYear(evModelYear));
    dispatch(updateEereICEReplacementVehicle(iceReplacementVehicle));
  };
}
