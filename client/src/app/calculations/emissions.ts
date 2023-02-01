import { sortObjectByKeys } from 'app/calculations/utilities';
import type { RegionId, StateId } from 'app/config';
import type { RDFJSON } from 'app/redux/reducers/geography';
/**
 * Annual point-source data from the National Emissions Inventory (NEI) for
 * every electric generating unit (EGU), organized by AVERT region
 */
// import neiData from 'app/data/annual-emission-factors.json';

const emissionsFields = ["generation", "so2", "nox", "co2", "pm25", "vocs", "nh3"] as const; // prettier-ignore

export type EmissionsChanges = ReturnType<typeof calculateEmissionsChanges>; // TODO: determine if this needs to be exported
export type AggregatedEmissionsData = ReturnType<
  typeof calculateAggregatedEmissionsData
>;

type EguData = EmissionsChanges[string];

export type EmissionsData = {
  [field in typeof emissionsFields[number]]: {
    power: {
      monthly: EguData['data'][keyof EguData['data']];
      annual: { original: number; postEere: number };
    };
    vehicle: number | null;
  };
};

export type EmissionsFlagsField = EguData['emissionsFlags'][number];

type NEIData = {
  regions: {
    name: string;
    egus: {
      state: string;
      county: string;
      plant: string;
      orispl_code: number;
      unit_code: string;
      full_name: string;
      annual_data: {
        year: number;
        generation: number;
        heat: number;
        pm25: number;
        vocs: number;
        nh3: number;
      }[];
    }[];
  }[];
};

type RDFDataField = keyof RDFJSON['data'];

/**
 * Adds a number to an array of numbers, sorts it, and returns the index of the
 * number directly before the one that was inserted
 */
function getPrecedingIndex(array: number[], number: number) {
  // insert provided number into the provided array and sort it
  const sortedArray = array.concat(number).sort((a, b) => a - b);
  const numberIndex = sortedArray.indexOf(number);
  // return the index of the number directly before the inserted number
  if (array[numberIndex] === number) return numberIndex;
  return numberIndex - 1;
}

/**
 * TODO
 */
function calculateLinear(options: {
  load: number;
  genA: number;
  genB: number;
  edgeA: number;
  edgeB: number;
}) {
  const { load, genA, genB, edgeA, edgeB } = options;
  const slope = (genA - genB) / (edgeA - edgeB);
  const intercept = genA - slope * edgeA;
  return load * slope + intercept;
}

/**
 * *****************************************************************************
 * NOTE: This is a TypeScript version of the `calculateEmissionsChanges()`
 * function found in the server app (`server/app/calculations.js`). This
 * TypeScript version of the function isn't actually used in the client app, but
 * it's return type (`EmissionsChanges`) is used. Ideally, we'd use this version
 * within the client app and calculate the emissions changes in the client app,
 * but the calculations are too intesive and lock the UI, which is why we
 * offload them to the server app, and receive the results through API calls.
 *
 * TLDR; much of the code in this file is for reference only (except for the
 * return type, which is currently used) in case we're able update the client
 * app at some point in the future in a way where we can handle the emissions
 * calculations in the client app alone.
 * *****************************************************************************
 *
 * Calculates emissions changes for a provided region.
 */
function calculateEmissionsChanges(options: {
  year: number;
  rdf: RDFJSON;
  neiData: NEIData;
  hourlyEere: number[];
}) {
  const { year, rdf, neiData, hourlyEere } = options;

  /**
   * NOTE: Emissions rates for generation, so2, nox, and co2 are calculated with
   * data in the RDF's `data` object under it's corresponding key: ozone season
   * data matches the field exactly (e.g. `data.so2`, `data.nox`) and non-ozone
   * season data has a `_not` suffix in the field name (e.g. `data.so2_not`,
   * `data.nox_not`). There's no non-ozone season for generation, so it always
   * uses `data.generation`, regardless of ozone season.
   *
   * Emissions rates for pm2.5, vocs, and nh3 are calculated with both annual
   * point-source data from the National Emissions Inventory (`neiData`) and the
   * `heat` and `heat_not` fields in the RDF's `data` object (for ozone and
   * non-ozone season respectively).
   */
  const result = {} as {
    [eguId: string]: {
      region: string;
      state: string;
      county: string;
      lat: number;
      lon: number;
      fuelType: string;
      orisplCode: number;
      unitCode: string;
      name: string;
      emissionsFlags: ('generation' | 'so2' | 'nox' | 'co2' | 'heat')[];
      data: {
        generation: { [month: number]: { original: number; postEere: number } };
        so2: { [month: number]: { original: number; postEere: number } };
        nox: { [month: number]: { original: number; postEere: number } };
        co2: { [month: number]: { original: number; postEere: number } };
        pm25: { [month: number]: { original: number; postEere: number } };
        vocs: { [month: number]: { original: number; postEere: number } };
        nh3: { [month: number]: { original: number; postEere: number } };
      };
    };
  };

  const dataFields = ['generation', 'so2', 'nox', 'co2', 'pm25', 'vocs', 'nh3'] as const; // prettier-ignore
  const neiFields = ['pm25', 'vocs', 'nh3'];

  type OzoneSeasonDataField =
    | (RDFDataField & typeof dataFields[number])
    | 'heat';

  const regionalNeiEgus = neiData.regions.find((region) => {
    return region.name === rdf.region.region_name;
  })?.egus;

  const regionId = rdf.region.region_abbv;

  const loadBinEdges = rdf.load_bin_edges;
  const firstLoadBinEdge = loadBinEdges[0];
  const lastLoadBinEdge = loadBinEdges[loadBinEdges.length - 1];

  /**
   * Iterate over each hour in the year (8760 in non-leap years)
   */
  for (const [i, hourlyLoad] of rdf.regional_load.entries()) {
    const month = hourlyLoad.month; // numeric month of load

    const originalLoad = hourlyLoad.regional_load_mw; // original regional load (mwh) for the hour
    const postEereLoad = originalLoad + hourlyEere[i]; // EERE-merged regional load (mwh) for the hour

    const originalLoadInBounds = originalLoad >= firstLoadBinEdge && originalLoad <= lastLoadBinEdge; // prettier-ignore
    const postEereLoadInBounds = postEereLoad >= firstLoadBinEdge && postEereLoad <= lastLoadBinEdge; // prettier-ignore

    // filter out outliers
    if (!(originalLoadInBounds && postEereLoadInBounds)) continue;

    // get index of load bin edge closest to originalLoad or postEereLoad
    const originalLoadBinEdgeIndex = getPrecedingIndex(loadBinEdges, originalLoad); // prettier-ignore
    const postEereLoadBinEdgeIndex = getPrecedingIndex(loadBinEdges, postEereLoad); // prettier-ignore

    /**
     * Iterate over each data field: generation, so2, nox, co2...
     */
    dataFields.forEach((field) => {
      /**
       * NOTE: PM2.5, VOCs, and NH3 always use the `heat` or `heat_not` fields
       * of the RDF's `data` object
       */
      const ozoneSeasonData = neiFields.includes(field)
        ? rdf.data.heat
        : rdf.data[field as RDFDataField];

      const nonOzoneSeasonData =
        field === 'generation'
          ? null // NOTE: there's no non-ozone season for generation
          : neiFields.includes(field)
          ? rdf.data.heat_not
          : rdf.data[`${field}_not` as RDFDataField];

      const ozoneSeasonMedians = ozoneSeasonData.map((egu) => egu.medians);

      const nonOzoneSeasonMedians = nonOzoneSeasonData
        ? nonOzoneSeasonData.map((egu) => egu.medians)
        : null;

      /**
       * Ozone season is between May and September, so use the correct medians
       * dataset for the current month
       */
      const datasetMedians = !nonOzoneSeasonMedians
        ? ozoneSeasonMedians
        : month >= 5 && month <= 9
        ? ozoneSeasonMedians
        : nonOzoneSeasonMedians;

      /**
       * Iterate over each electric generating unit (EGU). The total number of
       * EGUs varries per region (less than 100 for the RM region; more than
       * 1000 for the SE region)
       */
      ozoneSeasonData.forEach((egu, eguIndex) => {
        const {
          state,
          county,
          lat,
          lon,
          fuel_type,
          orispl_code,
          unit_code,
          full_name,
          infreq_emissions_flag,
        } = egu;

        const eguId = `${regionId}_${state}_${orispl_code}_${unit_code}`;
        const medians = datasetMedians[eguIndex];

        const calculatedOriginal = calculateLinear({
          load: originalLoad,
          genA: medians[originalLoadBinEdgeIndex],
          genB: medians[originalLoadBinEdgeIndex + 1],
          edgeA: loadBinEdges[originalLoadBinEdgeIndex],
          edgeB: loadBinEdges[originalLoadBinEdgeIndex + 1],
        });

        /**
         * Handle special exclusions for emissions changes at specific EGUs
         * (specifically added for errors with SO2 reporting, but the RDFs were
         * updated to include the `infreq_emissions_flag` for all pollutants for
         * consistency, which allows other pollutants at specific EGUs to be
         * excluded in the future)
         */
        const calculatedPostEere =
          infreq_emissions_flag === 1
            ? calculatedOriginal
            : calculateLinear({
                load: postEereLoad,
                genA: medians[postEereLoadBinEdgeIndex],
                genB: medians[postEereLoadBinEdgeIndex + 1],
                edgeA: loadBinEdges[postEereLoadBinEdgeIndex],
                edgeB: loadBinEdges[postEereLoadBinEdgeIndex + 1],
              });

        /**
         * Conditionally multiply NEI factor to calculated original and postEere
         * values
         */
        const matchedEgu = regionalNeiEgus?.find((neiEgu) => {
          const orisplCodeMatches = neiEgu.orispl_code === orispl_code;
          const unitCodeMatches = neiEgu.unit_code === unit_code;
          return orisplCodeMatches && unitCodeMatches;
        });
        const neiEguData = matchedEgu?.annual_data.find((d) => d.year === year);
        const neiFieldData = neiEguData?.[field as keyof typeof neiEguData];

        const original =
          neiFields.includes(field) && neiFieldData !== undefined
            ? calculatedOriginal * neiFieldData
            : calculatedOriginal;

        const postEere =
          neiFields.includes(field) && neiFieldData !== undefined
            ? calculatedPostEere * neiFieldData
            : calculatedPostEere;

        /**
         * Conditionally initialize each EGU's metadata
         */
        result[eguId] ??= {
          region: regionId,
          state: state,
          county: county,
          lat: lat,
          lon: lon,
          fuelType: fuel_type,
          orisplCode: orispl_code,
          unitCode: unit_code,
          name: full_name,
          emissionsFlags: [],
          data: {
            generation: {},
            so2: {},
            nox: {},
            co2: {},
            pm25: {},
            vocs: {},
            nh3: {},
          },
        };

        /**
         * Conditionally add field (e.g. so2, nox, co2) to EGU's emissions
         * flags, as emissions "replacement" will be needed for that pollutant
         */
        if (
          infreq_emissions_flag === 1 &&
          !result[eguId].emissionsFlags.includes(field as OzoneSeasonDataField)
        ) {
          result[eguId].emissionsFlags.push(field as OzoneSeasonDataField);
        }

        /**
         * Conditionally initialize the field's monthly data
         */
        result[eguId].data[field][month] ??= { original: 0, postEere: 0 };

        /**
         * Increment the field's monthly original and postEere values
         */
        result[eguId].data[field][month].original += original;
        result[eguId].data[field][month].postEere += postEere;
      });
    });
  }

  return result;
}

/**
 * Creates the intial structure of monthly and annual emissions data for each
 * pollutant.
 */
function createInitialEmissionsData() {
  const result = emissionsFields.reduce((object, field) => {
    const monthlyData = [...Array(12)].reduce((data, _item, index) => {
      const month = index + 1;
      data[month] = { original: 0, postEere: 0 };
      return data;
    }, {} as EguData['data'][keyof EguData['data']]);

    object[field] = {
      power: {
        monthly: monthlyData,
        annual: { original: 0, postEere: 0 },
      },
      vehicle: null,
    };

    return object;
  }, {} as EmissionsData);

  return result;
}

/**
 * Sum the provided EGUs emissions data into monthly and annual original and
 * post-EERE values for each pollutant.
 */
export function calculateAggregatedEmissionsData(egus: EmissionsChanges) {
  if (Object.keys(egus).length === 0) return null;

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
        const pollutant = annualKey as keyof typeof eguData.data;

        Object.entries(annualData).forEach(([monthlyKey, monthlyData]) => {
          const month = Number(monthlyKey);
          const { original, postEere } = monthlyData;

          object.total[pollutant].power.monthly[month].original += original;
          object.total[pollutant].power.monthly[month].postEere += postEere;
          object.total[pollutant].power.annual.original += original;
          object.total[pollutant].power.annual.postEere += postEere;

          object.regions[regionId][pollutant].power.monthly[month].original += original; // prettier-ignore
          object.regions[regionId][pollutant].power.monthly[month].postEere += postEere; // prettier-ignore
          object.regions[regionId][pollutant].power.annual.original += original;
          object.regions[regionId][pollutant].power.annual.postEere += postEere;

          object.states[stateId][pollutant].power.monthly[month].original += original; // prettier-ignore
          object.states[stateId][pollutant].power.monthly[month].postEere += postEere; // prettier-ignore
          object.states[stateId][pollutant].power.annual.original += original;
          object.states[stateId][pollutant].power.annual.postEere += postEere;

          object.counties[stateId][county][pollutant].power.monthly[month].original += original; // prettier-ignore
          object.counties[stateId][county][pollutant].power.monthly[month].postEere += postEere; // prettier-ignore
          object.counties[stateId][county][pollutant].power.annual.original += original; // prettier-ignore
          object.counties[stateId][county][pollutant].power.annual.postEere += postEere; // prettier-ignore
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
      total: EmissionsData;
      regions: { [regionId in RegionId]: EmissionsData };
      states: { [stateId in StateId]: EmissionsData };
      counties: { [stateId in StateId]: { [county: string]: EmissionsData } };
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
