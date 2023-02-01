import type { AppThunk } from 'app/redux/index';
import { setStatesAndCounties } from 'app/redux/reducers/monthlyEmissions';
import { setDownloadData } from 'app/redux/reducers/downloads';
import { sortObjectByKeys } from 'app/calculations/utilities';
import type { EmissionsChanges } from 'app/calculations/emissions';
import type { RegionId, StateId } from 'app/config';
import { regions } from 'app/config';

export type EmissionsData = EmissionsChanges[string]['data'];
export type EmissionsFlagsField = EmissionsChanges[string]['emissionsFlags'][number]; // prettier-ignore
export type AggregatedEmissionsData = ReturnType<
  typeof calculateAggregatedEmissionsData
>;
export type EgusNeeingEmissionsReplacement = ReturnType<typeof setEgusNeedingEmissionsReplacement>; // prettier-ignore
export type EmissionsReplacements = ReturnType<typeof setEmissionsReplacements>;

type Action =
  | { type: 'results/RESET_RESULTS' }
  | { type: 'results/FETCH_EMISSIONS_CHANGES_REQUEST' }
  | {
      type: 'results/FETCH_EMISSIONS_CHANGES_SUCCESS';
      payload: { emissionsChanges: EmissionsChanges };
    }
  | { type: 'results/FETCH_EMISSIONS_CHANGES_FAILURE' }
  | {
      type: 'results/SET_AGGREGATED_EMISSIONS_DATA';
      payload: { aggregatedEmissionsData: AggregatedEmissionsData };
    }
  | {
      type: 'results/SET_EGUS_NEEDING_EMISSIONS_REPLACEMENT';
      payload: {
        egusNeedingEmissionsReplacement: EgusNeeingEmissionsReplacement;
      };
    }
  | {
      type: 'results/SET_EMISSIONS_REPLACEMENTS';
      payload: { emissionsReplacements: EmissionsReplacements };
    };

type State = {
  emissionsChanges:
    | { status: 'idle'; data: {} }
    | { status: 'pending'; data: {} }
    | { status: 'success'; data: EmissionsChanges }
    | { status: 'failure'; data: {} };
  aggregatedEmissionsData: AggregatedEmissionsData;
  egusNeedingEmissionsReplacement: EgusNeeingEmissionsReplacement;
  emissionsReplacements: EmissionsReplacements | {};
};

const initialState: State = {
  emissionsChanges: {
    status: 'idle',
    data: {},
  },
  aggregatedEmissionsData: null,
  egusNeedingEmissionsReplacement: {},
  emissionsReplacements: {},
};

export default function reducer(
  state: State = initialState,
  action: Action,
): State {
  switch (action.type) {
    case 'results/RESET_RESULTS': {
      return initialState;
    }

    case 'results/FETCH_EMISSIONS_CHANGES_REQUEST': {
      return {
        ...initialState,
        emissionsChanges: {
          status: 'pending',
          data: {},
        },
      };
    }

    case 'results/FETCH_EMISSIONS_CHANGES_SUCCESS': {
      const { emissionsChanges } = action.payload;
      return {
        ...state,
        emissionsChanges: {
          status: 'success',
          data: emissionsChanges,
        },
      };
    }

    case 'results/FETCH_EMISSIONS_CHANGES_FAILURE': {
      return {
        ...state,
        emissionsChanges: {
          status: 'failure',
          data: {},
        },
      };
    }

    case 'results/SET_AGGREGATED_EMISSIONS_DATA': {
      const { aggregatedEmissionsData } = action.payload;
      return {
        ...state,
        aggregatedEmissionsData,
      };
    }

    case 'results/SET_EGUS_NEEDING_EMISSIONS_REPLACEMENT': {
      const { egusNeedingEmissionsReplacement } = action.payload;
      return {
        ...state,
        egusNeedingEmissionsReplacement,
      };
    }

    case 'results/SET_EMISSIONS_REPLACEMENTS': {
      const { emissionsReplacements } = action.payload;
      return {
        ...state,
        emissionsReplacements,
      };
    }

    default: {
      return state;
    }
  }
}

/**
 * Called every time the "Back to EE/RE Impacts" button or the "Reselect
 * Geography" button is clicked on the "Get Results" page.
 */
export function resetResults(): Action {
  return { type: 'results/RESET_RESULTS' };
}

/**
 * Called every time the "Get Results" button is clicked on the "Set EE/RE
 * Impacts" page.
 */
export function fetchEmissionsChanges(): AppThunk {
  return (dispatch, getState) => {
    const { api, eere } = getState();
    const { regionalProfiles } = eere;

    dispatch({ type: 'results/FETCH_EMISSIONS_CHANGES_REQUEST' });

    // build up requests for selected regions
    const requests: Promise<Response>[] = [];

    for (const regionId in regionalProfiles) {
      const hourlyEere = regionalProfiles[regionId as RegionId]?.hourlyEere;

      if (hourlyEere) {
        requests.push(
          fetch(`${api.baseUrl}/api/v1/emissions`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ regionId, hourlyEere }),
          }),
        );
      }
    }

    // request all data for selected regions in parallel
    Promise.all(requests)
      .then((responses) => Promise.all(responses.map((res) => res.json())))
      .then((regionsData: EmissionsChanges[]) => {
        // flatten array of regionData objects into a single object
        const emissionsChanges = regionsData.reduce((result, regionData) => {
          return { ...result, ...regionData };
        }, {});

        const aggregatedEmissionsData =
          calculateAggregatedEmissionsData(emissionsChanges);

        const egusNeedingEmissionsReplacement =
          setEgusNeedingEmissionsReplacement(emissionsChanges);

        const emissionsReplacements = setEmissionsReplacements(
          egusNeedingEmissionsReplacement,
        );

        dispatch({
          type: 'results/FETCH_EMISSIONS_CHANGES_SUCCESS',
          payload: { emissionsChanges },
        });

        dispatch({
          type: 'results/SET_AGGREGATED_EMISSIONS_DATA',
          payload: { aggregatedEmissionsData },
        });

        dispatch({
          type: 'results/SET_EGUS_NEEDING_EMISSIONS_REPLACEMENT',
          payload: { egusNeedingEmissionsReplacement },
        });

        dispatch({
          type: 'results/SET_EMISSIONS_REPLACEMENTS',
          payload: { emissionsReplacements },
        });

        dispatch(setStatesAndCounties());
        dispatch(setDownloadData());
      })
      .catch((err) => {
        dispatch({ type: 'results/FETCH_EMISSIONS_CHANGES_FAILURE' });
      });
  };
}

/**
 * Creates the intial structure of monthly and annual emissions data for each
 * pollutant.
 */
function createInitialEmissionsData() {
  const fields = ["generation", "so2", "nox", "co2", "pm25", "vocs", "nh3"] as const; // prettier-ignore

  const result = fields.reduce(
    (object, field) => {
      const monthlyData = [...Array(12)].reduce((data, _item, index) => {
        const month = index + 1;
        data[month] = { original: 0, postEere: 0 };
        return data;
      }, {} as EmissionsData[keyof EmissionsData]);

      object[field] = {
        monthly: monthlyData,
        annual: { original: 0, postEere: 0 },
      };

      return object;
    },
    {} as {
      [field in typeof fields[number]]: {
        monthly: EmissionsData[keyof EmissionsData];
        annual: { original: 0; postEere: 0 };
      };
    },
  );

  return result;
}

/**
 * Sum the provided EGUs emissions data into monthly and annual original and
 * post-EERE values for each pollutant.
 */
function calculateAggregatedEmissionsData(egus: EmissionsChanges) {
  if (Object.keys(egus).length === 0) return null;

  const fields = ["generation", "so2", "nox", "co2", "pm25", "vocs", "nh3"] as const; // prettier-ignore

  const result = Object.values(egus).reduce(
    (object, eguData) => {
      const regionId = eguData.region as RegionId;
      const stateId = eguData.state as StateId;
      const county = eguData.county;

      object.regions[regionId] ??= createInitialEmissionsData();
      object.states[stateId] ??= createInitialEmissionsData();
      object.counties[stateId] ??= {};
      object.counties[stateId][county] ??= createInitialEmissionsData();

      Object.entries(eguData.data).forEach(([annualKey, annualData]) => {
        const pollutant = annualKey as keyof EmissionsData;

        Object.entries(annualData).forEach(([monthlyKey, monthlyData]) => {
          const month = Number(monthlyKey);
          const { original, postEere } = monthlyData;

          object.total[pollutant].monthly[month].original += original;
          object.total[pollutant].monthly[month].postEere += postEere;
          object.total[pollutant].annual.original += original;
          object.total[pollutant].annual.postEere += postEere;

          object.regions[regionId][pollutant].monthly[month].original += original; // prettier-ignore
          object.regions[regionId][pollutant].monthly[month].postEere += postEere; // prettier-ignore
          object.regions[regionId][pollutant].annual.original += original;
          object.regions[regionId][pollutant].annual.postEere += postEere;

          object.states[stateId][pollutant].monthly[month].original += original;
          object.states[stateId][pollutant].monthly[month].postEere += postEere;
          object.states[stateId][pollutant].annual.original += original;
          object.states[stateId][pollutant].annual.postEere += postEere;

          object.counties[stateId][county][pollutant].monthly[month].original += original; // prettier-ignore
          object.counties[stateId][county][pollutant].monthly[month].postEere += postEere; // prettier-ignore
          object.counties[stateId][county][pollutant].annual.original += original; // prettier-ignore
          object.counties[stateId][county][pollutant].annual.postEere += postEere; // prettier-ignore
        });
      });

      return object;
    },
    {
      total: createInitialEmissionsData(),
      regions: {},
      states: {},
      counties: {},
    } as {
      total: {
        [field in typeof fields[number]]: {
          monthly: EmissionsData[keyof EmissionsData];
          annual: { original: 0; postEere: 0 };
        };
      };
      regions: {
        [regionId in RegionId]: {
          [field in typeof fields[number]]: {
            monthly: EmissionsData[keyof EmissionsData];
            annual: { original: 0; postEere: 0 };
          };
        };
      };
      states: {
        [stateId in StateId]: {
          [field in typeof fields[number]]: {
            monthly: EmissionsData[keyof EmissionsData];
            annual: { original: 0; postEere: 0 };
          };
        };
      };
      counties: {
        [stateId in StateId]: {
          [county: string]: {
            [field in typeof fields[number]]: {
              monthly: EmissionsData[keyof EmissionsData];
              annual: { original: 0; postEere: 0 };
            };
          };
        };
      };
    },
  );

  // sort results alphabetically
  result.regions = sortObjectByKeys(result.regions);
  result.states = sortObjectByKeys(result.states);
  result.counties = sortObjectByKeys(result.counties);
  result.counties = Object.entries(result.counties).reduce(
    (object, [stateId, counties]) => {
      object[stateId as StateId] = sortObjectByKeys(counties);
      return object;
    },
    {} as typeof result.counties,
  );

  return result;
}

/**
 * An EGU is marked as needing emissions "replacement" if it's `emissionsFlag`
 * array isn't empty. In calculating the emissions changes (via the server app's
 * `calculateEmissionsChanges()` function), a pollutant that needs replacement
 * will have the `infreq_emissions_flag` property's value of 1 for the given
 * given in the region's RDF.
 */
function setEgusNeedingEmissionsReplacement(egus: EmissionsChanges) {
  if (Object.keys(egus).length === 0) return {};

  const result = Object.entries(egus).reduce((object, [eguId, eguData]) => {
    if (eguData.emissionsFlags.length !== 0) {
      object[eguId] = eguData;
    }

    return object;
  }, {} as EmissionsChanges);

  return result;
}

/**
 * Build up emissions replacement values for each pollutant from provided EGUs
 * needing emissions replacement, and the region's actual emissions value for
 * that particular pollutant.
 */
function setEmissionsReplacements(egus: EmissionsChanges) {
  if (Object.keys(egus).length === 0) {
    return {} as { [pollutant in EmissionsFlagsField]: number };
  }

  const replacementsByRegion = Object.values(egus).reduce(
    (object, egu) => {
      const regionId = egu.region as RegionId;

      egu.emissionsFlags.forEach((pollutant) => {
        object[pollutant] ??= {};
        object[pollutant][regionId] = regions[regionId].actualEmissions[pollutant]; // prettier-ignore
      });

      return object;
    },
    {} as {
      [pollutant in EmissionsFlagsField]: Partial<{
        [regionId in RegionId]: number;
      }>;
    },
  );

  const result = Object.entries(replacementsByRegion).reduce(
    (object, [key, regionData]) => {
      const pollutant = key as EmissionsFlagsField;
      object[pollutant] = Object.values(regionData).reduce((a, b) => (a += b));
      return object;
    },
    {} as { [pollutant in EmissionsFlagsField]: number },
  );

  return result;
}
