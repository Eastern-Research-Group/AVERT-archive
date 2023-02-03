import type {
  GeographicFocus,
  RegionState,
  StateState,
} from 'app/redux/reducers/geography';
import { sortObjectByKeys } from 'app/calculations/utilities';
import type { RegionId, RegionName, StateId } from 'app/config';
/**
 * Excel: "CountyFIPS" sheet.
 */
import countyFips from 'app/data/county-fips.json';

export type CountiesByRegion = ReturnType<typeof organizeCountiesByRegion>;
export type RegionalScalingFactors = ReturnType<
  typeof calculateRegionalScalingFactors
>;
export type SelectedGeographyRegions = ReturnType<
  typeof getSelectedGeographyRegions
>;
export type SelectedGeographyCounties = ReturnType<
  typeof getSelectedGeographyCounties
>;

/**
 * Organizes counties into AVERT regions.
 */
export function organizeCountiesByRegion(options: {
  regions: { [regionId in RegionId]: RegionState };
}) {
  const { regions } = options;

  const result = {} as {
    [regionId in RegionId]: Partial<{
      [stateId in StateId]: string[];
    }>;
  };

  countyFips.forEach((data) => {
    const regionName = data['AVERT Region'] as RegionName;
    const stateId = data['Postal State Code'] as StateId;
    const county = data['County Name Long'];

    const regionId = Object.entries(regions).find(([_, region]) => {
      return region.name === regionName;
    })?.[0] as RegionId | undefined;

    if (regionId) {
      result[regionId] ??= {} as Partial<{ [stateId in StateId]: string[] }>;

      const regionResult = result[regionId];

      if (regionResult) {
        regionResult[stateId] ??= [];
        regionResult[stateId]?.push(county);
      }
    }
  });

  return sortObjectByKeys(result);
}

/**
 * Each regional scaling factor is a number between 0 and 1, representing the
 * proportion the selected geography exists within a given region.
 *
 * - If a region is selected, the regional scaling factor will always be 1.
 *
 * - If a state is selected, the regional scaling factor comes from the selected
 *   state's percentage by region value for the given region, as defined in the
 *   config file (`app/config.ts`).
 *
 *   For example, if the state falls exactly equally between the two regions,
 *   the regional scaling factor would be 0.5 for each of those two regions.
 */
export function calculateRegionalScalingFactors(options: {
  geographicFocus: GeographicFocus;
  selectedRegion: RegionState | undefined;
  selectedState: StateState | undefined;
}) {
  const { geographicFocus, selectedRegion, selectedState } = options;

  const result = {} as Partial<{ [regionId in RegionId]: number }>;

  if (geographicFocus === 'regions' && selectedRegion) {
    result[selectedRegion.id] = 1;
  }

  if (geographicFocus === 'states' && selectedState) {
    Object.entries(selectedState.percentageByRegion).forEach(
      ([regionId, data]) => {
        result[regionId as RegionId] = data / 100;
      },
    );
  }

  return result;
}

/**
 * Returns regions data for the selected geography.
 */
export function getSelectedGeographyRegions(options: {
  regions: { [regionId in RegionId]: RegionState };
  selectedGeographyRegionIds: RegionId[];
}) {
  const { regions, selectedGeographyRegionIds } = options;

  const result = Object.entries(regions).reduce((object, [id, regionData]) => {
    if (selectedGeographyRegionIds.includes(regionData.id)) {
      object[id as RegionId] = regionData;
    }
    return object;
  }, {} as Partial<{ [regionId in RegionId]: RegionState }>);

  return result;
}

/**
 * Returns the counties for the selected geography.
 */
export function getSelectedGeographyCounties(options: {
  selectedGeographyRegions: SelectedGeographyRegions;
}) {
  const { selectedGeographyRegions } = options;

  const result = {} as Partial<{
    [regionId in RegionId]: Partial<{
      [stateId in StateId]: string[];
    }>;
  }>;

  const selectedRegions = Object.entries(selectedGeographyRegions).reduce(
    (object, [key, value]) => {
      const regionId = key as keyof typeof selectedGeographyRegions;
      object[regionId] = value.name;
      return object;
    },
    {} as { [regionId in RegionId]: string },
  );

  countyFips.forEach((data) => {
    const regionName = data['AVERT Region'] as RegionName;
    const stateId = data['Postal State Code'] as StateId;
    const county = data['County Name Long'];

    if (Object.values(selectedRegions).includes(regionName)) {
      const regionId = Object.entries(selectedRegions).find(([_, name]) => {
        return name === regionName;
      })?.[0] as RegionId | undefined;

      if (regionId) {
        result[regionId] ??= {} as Partial<{ [stateId in StateId]: string[] }>;

        const regionResult = result[regionId];

        if (regionResult) {
          regionResult[stateId] ??= [];
          regionResult[stateId]?.push(county);
        }
      }
    }
  });

  return result;
}
