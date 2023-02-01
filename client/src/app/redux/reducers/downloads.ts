import type { AppThunk } from 'app/redux/index';
import type { VehicleEmissionChangesByGeography } from 'app/calculations/transportation';
import type {
  EmissionsData,
  EmissionsFlagsField,
  EmissionsMonthlyData,
  EgusNeeingEmissionsReplacement,
} from 'app/redux/reducers/results';
import type { RegionId, StateId } from 'app/config';
import { regions as regionsConfig, states as statesConfig } from 'app/config';
/**
 * Excel: "CountyFIPS" sheet.
 */
import countyFips from 'app/data/county-fips.json';

type MonthlyData = EmissionsData[keyof EmissionsData];

type Pollutant = 'SO2' | 'NOX' | 'CO2' | 'PM25' | 'VOCS' | 'NH3';

type CountyData = {
  Pollutant: Pollutant;
  'Aggregation level': string;
  'FIPS Code': string | null;
  State: string | null;
  County: string | null;
  'Unit of measure': 'percent' | 'emissions (tons)' | 'emissions (pounds)';
  'Power Sector: January': number | null;
  'Power Sector: February': number | null;
  'Power Sector: March': number | null;
  'Power Sector: April': number | null;
  'Power Sector: May': number | null;
  'Power Sector: June': number | null;
  'Power Sector: July': number | null;
  'Power Sector: August': number | null;
  'Power Sector: September': number | null;
  'Power Sector: October': number | null;
  'Power Sector: November': number | null;
  'Power Sector: December': number | null;
  'Power Sector: Annual': number | null;
};

type CobraData = {
  FIPS: string;
  STATE: string;
  COUNTY: string;
  TIER1NAME: 'FUEL COMB. ELEC. UTIL.' | 'Highway Vehicles';
  NOx_REDUCTIONS_TONS: number;
  SO2_REDUCTIONS_TONS: number;
  PM25_REDUCTIONS_TONS: number;
  VOCS_REDUCTIONS_TONS: number;
  NH3_REDUCTIONS_TONS: number;
};

type Action = {
  type: 'downloads/SET_DOWNLOAD_DATA';
  payload: {
    countyData: CountyData[];
    cobraData: CobraData[];
  };
};

type State = {
  countyData: CountyData[];
  cobraData: CobraData[];
};

const initialState: State = {
  countyData: [],
  cobraData: [],
};

export default function reducer(
  state: State = initialState,
  action: Action,
): State {
  switch (action.type) {
    case 'downloads/SET_DOWNLOAD_DATA': {
      const { countyData, cobraData } = action.payload;

      return {
        ...state,
        countyData: countyData,
        cobraData: cobraData,
      };
    }

    default: {
      return state;
    }
  }
}

export function setDownloadData(): AppThunk {
  return (dispatch, getState) => {
    const { transportation, results } = getState();
    const { vehicleEmissionChangesByGeography } = transportation;
    const { emissionsMonthlyData, egusNeedingEmissionsReplacement } = results;

    const countyData = formatCountyDownloadData({
      emissionsMonthlyData,
      egusNeedingEmissionsReplacement,
    });

    const cobraData = formatCobraDownloadData({
      emissionsMonthlyData,
      vehicleEmissionChangesByGeography,
    });

    dispatch({
      type: 'downloads/SET_DOWNLOAD_DATA',
      payload: {
        countyData,
        cobraData,
      },
    });
  };
}

/**
 * Formats monthly emissions data to support downloading the data as a CSV file,
 * for more detailed exploration of the data at a county, state, and regional
 * level.
 */
function formatCountyDownloadData(options: {
  emissionsMonthlyData: EmissionsMonthlyData;
  egusNeedingEmissionsReplacement: EgusNeeingEmissionsReplacement;
}) {
  const { emissionsMonthlyData, egusNeedingEmissionsReplacement } = options;

  const result: CountyData[] = [];

  if (!emissionsMonthlyData) return result;

  const { total, regions, states, counties } = emissionsMonthlyData;
  const pollutantsRows = createOrderedPollutantsRows();
  const egusNeedingReplacement = Object.values(egusNeedingEmissionsReplacement);

  /**
   * Conditionally add all affected regions data
   * (will only occur a state was selected that's part of multiple regions)
   */
  if (Object.keys(regions).length > 1) {
    const totalRows = [...pollutantsRows].map((row) => {
      const { pollutant, unit } = row;

      const pollutantNeedsReplacement = egusNeedingReplacement.some((egu) => {
        return egu.emissionsFlags.includes(pollutant as EmissionsFlagsField);
      });

      const monthlyData = (total as EmissionsData)[pollutant];
      const monthlyFields = createMonthlyEmissionsDataFields({
        pollutantNeedsReplacement,
        monthlyData,
        unit,
      });

      return {
        Pollutant: pollutant.toUpperCase() as Pollutant,
        'Aggregation level': 'All Affected Regions',
        'FIPS Code': null,
        State: null,
        County: null,
        'Unit of measure': unit,
        ...monthlyFields,
      };
    });

    result.push(...totalRows);
  }

  /**
   * Add data from each region
   */
  Object.entries(regions).forEach(([regionId, regionData]) => {
    const regionsRows = [...pollutantsRows].map((row) => {
      const { pollutant, unit } = row;

      const pollutantNeedsReplacement = egusNeedingReplacement.some((egu) => {
        return (
          egu.emissionsFlags.includes(pollutant as EmissionsFlagsField) &&
          egu.region === regionId
        );
      });

      const monthlyData = regionData[pollutant];
      const monthlyFields = createMonthlyEmissionsDataFields({
        pollutantNeedsReplacement,
        monthlyData,
        unit,
      });

      return {
        Pollutant: pollutant.toUpperCase() as Pollutant,
        'Aggregation level': `${regionsConfig[regionId as RegionId].name} Region`, // prettier-ignore
        'FIPS Code': null,
        State: null,
        County: null,
        'Unit of measure': unit,
        ...monthlyFields,
      };
    });

    result.push(...regionsRows);
  });

  /**
   * Add data from each state
   */
  Object.entries(states).forEach(([stateId, stateData]) => {
    const fipsCode =
      countyFips.find((data) => {
        return data['Postal State Code'] === stateId;
      })?.['State and County FIPS Code'] || '';

    const statesRows = [...pollutantsRows].map((row) => {
      const { pollutant, unit } = row;

      const pollutantNeedsReplacement = egusNeedingReplacement.some((egu) => {
        return (
          egu.emissionsFlags.includes(pollutant as EmissionsFlagsField) &&
          egu.state === stateId
        );
      });

      const monthlyData = stateData[pollutant];
      const monthlyFields = createMonthlyEmissionsDataFields({
        pollutantNeedsReplacement,
        monthlyData,
        unit,
      });

      return {
        Pollutant: pollutant.toUpperCase() as Pollutant,
        'Aggregation level': 'State',
        'FIPS Code': fipsCode ? fipsCode.substring(0, 2) : null,
        State: stateId,
        County: null,
        'Unit of measure': unit,
        ...monthlyFields,
      };
    });

    result.push(...statesRows);
  });

  /**
   * Add data from each county
   */
  Object.entries(counties).forEach(([stateId, stateData]) => {
    Object.entries(stateData).forEach(([countyName, countyData]) => {
      const fipsCode =
        countyFips.find(
          (data) =>
            data['Postal State Code'] === stateId &&
            data['County Name Long'] === countyName,
        )?.['State and County FIPS Code'] || '';

      const countiesRows = [...pollutantsRows].map((row) => {
        const { pollutant, unit } = row;

        const pollutantNeedsReplacement = egusNeedingReplacement.some((egu) => {
          return (
            egu.emissionsFlags.includes(pollutant as EmissionsFlagsField) &&
            egu.state === stateId &&
            egu.county === countyName
          );
        });

        const monthlyData = countyData[pollutant];
        const monthlyFields = createMonthlyEmissionsDataFields({
          pollutantNeedsReplacement,
          monthlyData,
          unit,
        });

        return {
          Pollutant: pollutant.toUpperCase() as Pollutant,
          'Aggregation level': 'County',
          'FIPS Code': fipsCode,
          State: stateId,
          County: countyName.replace(/city/, '(City)'), // format 'city'
          'Unit of measure': unit,
          ...monthlyFields,
        };
      });

      result.push(...countiesRows);
    });
  });

  return result;
}

/**
 * Creates an array of pollutants (in a specific order) for first storing
 * emissions data for those pollutants, followed immediately by the same set of
 * pollutants for storing percent data.
 *
 * These sets arrays are created for each level of data returned in the
 * downloadable county data: all affected regions (if data contains multiple
 * regions), each region, each state, and each county.
 */
function createOrderedPollutantsRows() {
  const pollutants = ['so2', 'nox', 'co2', 'pm25', 'vocs', 'nh3'] as const;

  const emissionsRows = pollutants.map((pollutant) => {
    return {
      pollutant,
      unit: `emissions (${pollutant === 'co2' ? 'tons' : 'pounds'})` as const,
    };
  });

  const percentRows = pollutants.map((pollutant) => {
    return {
      pollutant,
      unit: 'percent' as const,
    };
  });

  return [...emissionsRows, ...percentRows];
}

/**
 * Creates monthly power sector data fields for either emissions changes or
 * percentage changes, for use in the downloadable county data.
 */
function createMonthlyEmissionsDataFields(options: {
  pollutantNeedsReplacement: boolean;
  monthlyData: MonthlyData;
  unit: 'percent' | 'emissions (tons)' | 'emissions (pounds)';
}) {
  const { pollutantNeedsReplacement, monthlyData, unit } = options;

  /** annual totals */
  const total = Object.values(monthlyData).reduce(
    (object, data) => {
      object.original += data.original;
      object.postEere += data.postEere;
      return object;
    },
    { original: 0, postEere: 0 },
  );

  const totalEmissionsChange = total.postEere - total.original;
  const totalPercentChange = (totalEmissionsChange / total.original) * 100 || 0;

  const result = Object.entries(monthlyData).reduce((object, [key, data]) => {
    const month = Number(key);
    const { original, postEere } = data;

    const emissionsChange = postEere - original;
    const percentChange = (emissionsChange / original) * 100 || 0;

    object[month] =
      unit === 'percent'
        ? pollutantNeedsReplacement
          ? null
          : percentChange
        : emissionsChange;

    return object;
  }, {} as { [month: number]: number | null });

  return {
    'Power Sector: January': result[1],
    'Power Sector: February': result[2],
    'Power Sector: March': result[3],
    'Power Sector: April': result[4],
    'Power Sector: May': result[5],
    'Power Sector: June': result[6],
    'Power Sector: July': result[7],
    'Power Sector: August': result[8],
    'Power Sector: September': result[9],
    'Power Sector: October': result[10],
    'Power Sector: November': result[11],
    'Power Sector: December': result[12],
    'Power Sector: Annual':
      unit === 'percent' ? totalPercentChange : totalEmissionsChange,
  };
}

/**
 * Formats monthly emissions data to support downloading the data as a CSV file,
 * for use within the COBRA application.
 */
function formatCobraDownloadData(options: {
  emissionsMonthlyData: EmissionsMonthlyData;
  vehicleEmissionChangesByGeography: VehicleEmissionChangesByGeography | {};
}) {
  const { emissionsMonthlyData, vehicleEmissionChangesByGeography } = options;

  const result: CobraData[] = [];

  const vehicleEmissionChanges =
    Object.keys(vehicleEmissionChangesByGeography).length !== 0
      ? (vehicleEmissionChangesByGeography as VehicleEmissionChangesByGeography)
      : null;

  if (!emissionsMonthlyData || !vehicleEmissionChanges) return result;

  const { counties } = emissionsMonthlyData;

  // add power sector data
  Object.entries(counties).forEach(([stateId, stateData]) => {
    Object.entries(stateData).forEach(([countyName, countyData]) => {
      const totalEmissionsChanges = calculateTotalEmissionsChanges(countyData);

      const state = statesConfig[stateId as StateId].name;
      const county = countyName.replace(/city/, '(City)'); // format 'city'
      const fipsCode =
        countyFips.find(
          (data) =>
            data['State Name'] === state &&
            data['County Name Long'] === countyName,
        )?.['State and County FIPS Code'] || '';

      const noxTons = Number((totalEmissionsChanges.nox / 2_000).toFixed(3));
      const so2Tons = Number((totalEmissionsChanges.so2 / 2_000).toFixed(3));
      const pm25Tons = Number((totalEmissionsChanges.pm25 / 2_000).toFixed(3));
      const vocsTons = Number((totalEmissionsChanges.vocs / 2_000).toFixed(3));
      const nh3Tons = Number((totalEmissionsChanges.nh3 / 2_000).toFixed(3));

      result.push({
        FIPS: fipsCode,
        STATE: state,
        COUNTY: county,
        TIER1NAME: 'FUEL COMB. ELEC. UTIL.' as const,
        NOx_REDUCTIONS_TONS: noxTons,
        SO2_REDUCTIONS_TONS: so2Tons,
        PM25_REDUCTIONS_TONS: pm25Tons,
        VOCS_REDUCTIONS_TONS: vocsTons,
        NH3_REDUCTIONS_TONS: nh3Tons,
      });
    });
  });

  // add transportation sector data
  Object.entries(vehicleEmissionChanges.counties).forEach(
    ([stateId, stateData]) => {
      Object.entries(stateData).forEach(([countyName, countyData]) => {
        const state = statesConfig[stateId as StateId].name;
        const county = countyName.replace(/city/, '(City)'); // format 'city'
        const fipsCode =
          countyFips.find(
            (data) =>
              data['State Name'] === state &&
              data['County Name Long'] === countyName,
          )?.['State and County FIPS Code'] || '';

        const noxTons = Number((countyData.NOX / 2_000).toFixed(3));
        const so2Tons = Number((countyData.SO2 / 2_000).toFixed(3));
        const pm25Tons = Number((countyData.PM25 / 2_000).toFixed(3));
        const vocsTons = Number((countyData.VOCs / 2_000).toFixed(3));
        const nh3Tons = Number((countyData.NH3 / 2_000).toFixed(3));

        result.push({
          FIPS: fipsCode,
          STATE: state,
          COUNTY: county,
          TIER1NAME: 'Highway Vehicles' as const,
          NOx_REDUCTIONS_TONS: noxTons,
          SO2_REDUCTIONS_TONS: so2Tons,
          PM25_REDUCTIONS_TONS: pm25Tons,
          VOCS_REDUCTIONS_TONS: vocsTons,
          NH3_REDUCTIONS_TONS: nh3Tons,
        });
      });
    },
  );

  return result;
}

/**
 * Calculated total emissions changes from each pollutant's monthly data
 */
function calculateTotalEmissionsChanges(emissionsData: EmissionsData) {
  const result = Object.entries(emissionsData).reduce(
    (object, [key, monthlyData]) => {
      const pollutant = key as keyof EmissionsData;

      object[pollutant] = Object.values(monthlyData).reduce((total, data) => {
        return (total += data.postEere - data.original);
      }, 0);

      return object;
    },
    { generation: 0, so2: 0, nox: 0, co2: 0, pm25: 0, vocs: 0, nh3: 0 },
  );

  return result;
}
