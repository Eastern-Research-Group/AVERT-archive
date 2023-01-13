import { ReactNode } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useDispatch } from 'react-redux';
// ---
import { useTypedSelector } from 'app/redux/index';
import type {
  ReplacementPollutantName,
  MonthlyDisplacement,
} from 'app/redux/reducers/displacement';
import { calculateMonthlyData } from 'app/redux/reducers/displacement';
import {
  setMonthlyEmissionsAggregation,
  setMonthlyEmissionsRegionId,
  setMonthlyEmissionsStateId,
  setMonthlyEmissionsCountyName,
  seMonthlyEmissionsUnit,
} from 'app/redux/reducers/monthlyEmissions';
import { useSelectedRegion, useSelectedStateRegions } from 'app/hooks';
import { Pollutant, RegionId, StateId, regions, states } from 'app/config';

require('highcharts/modules/exporting')(Highcharts);
require('highcharts/modules/accessibility')(Highcharts);

function Chart(props: {
  pollutant: Pollutant;
  data: { [key in Pollutant]: MonthlyDisplacement };
}) {
  const { pollutant, data } = props;

  const geographicFocus = useTypedSelector(({ geography }) => geography.focus);
  const currentAggregation = useTypedSelector(
    ({ monthlyEmissions }) => monthlyEmissions.aggregation,
  );
  const currentRegionId = useTypedSelector(
    ({ monthlyEmissions }) => monthlyEmissions.regionId,
  );
  const currentStateId = useTypedSelector(
    ({ monthlyEmissions }) => monthlyEmissions.stateId,
  );
  const currentCountyName = useTypedSelector(
    ({ monthlyEmissions }) => monthlyEmissions.countyName,
  );
  const currentUnit = useTypedSelector(
    ({ monthlyEmissions }) => monthlyEmissions.unit,
  );
  const egusNeedingReplacement = useTypedSelector(
    ({ displacement }) => displacement.egusNeedingReplacement,
  );

  const selectedRegion = useSelectedRegion();
  const selectedStateRegions = useSelectedStateRegions();

  const replacementPotentiallyNeeded = ['generation', 'so2', 'nox', 'co2'];

  const flaggedEGUs = replacementPotentiallyNeeded.includes(pollutant)
    ? egusNeedingReplacement[pollutant as ReplacementPollutantName]
    : [];

  const flaggedRegion =
    currentAggregation === 'region' &&
    (geographicFocus === 'regions'
      ? flaggedEGUs.length > 0
      : (flaggedEGUs.length > 0 && currentRegionId === 'ALL') ||
        flaggedEGUs.filter((egu) => egu.regionId === currentRegionId).length >
          0);

  const flaggedState =
    currentAggregation === 'state' &&
    flaggedEGUs.some((egu) => egu.state === currentStateId);

  const flaggedCounty =
    currentAggregation === 'county' &&
    flaggedEGUs.some((egu) => {
      return egu.state === currentStateId && egu.county === currentCountyName;
    });

  // format 'city' if found in county name
  const countyName = currentCountyName.replace(/city/, '(City)');

  const regionChartTitle =
    geographicFocus === 'regions'
      ? `${selectedRegion?.name} Region`
      : geographicFocus === 'states'
      ? selectedStateRegions.length === 1
        ? `${regions[selectedStateRegions[0].id]?.name} Region`
        : currentRegionId === ''
        ? '' // multiple regions but a region has not yet been selected
        : currentRegionId === 'ALL'
        ? `${selectedStateRegions
            .map((region) => regions[region.id]?.name)
            .join(', ')} Regions`
        : `${regions[currentRegionId as RegionId]?.name} Region`
      : '';

  const stateChartTitle =
    currentStateId === ''
      ? '' // state has not yet been selected
      : `${states[currentStateId as StateId].name}`;

  const countyChartTitle =
    currentCountyName === ''
      ? '' // county has not yet been selected
      : `${countyName}, ${states[currentStateId as StateId].name}`;

  const chartLocationTitle =
    currentAggregation === 'region'
      ? regionChartTitle
      : currentAggregation === 'state'
      ? stateChartTitle
      : currentAggregation === 'county'
      ? countyChartTitle
      : '';

  function formatTitle(pollutant: string) {
    return `<tspan class='font-sans-md line-height-sans-2 text-base-darker text-center'>
        Change in ${pollutant} Emissions: ${chartLocationTitle}
      </tspan>`;
  }

  function formatYAxis(unit: string) {
    return currentUnit === 'percentages'
      ? 'Percent change'
      : `Emission changes (${unit})`;
  }

  const commonConfig: Highcharts.Options = {
    chart: {
      type: 'column',
      height: 240,
      style: {
        fontFamily: '"Open Sans", sans-serif',
      },
    },
    credits: {
      enabled: false,
    },
    legend: {
      enabled: false,
    },
    tooltip: {
      pointFormatter: function () {
        const dataPoint = this.y?.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        });

        const suffix =
          currentUnit === 'emissions'
            ? ` ${(this.series.options as any).unit}`
            : '%';

        return `<strong>${dataPoint}</strong>${suffix}`;
      },
    },
    lang: {
      contextButtonTitle: 'Export options',
    },
    exporting: {
      allowHTML: true,
    },
    xAxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], // prettier-ignore
    },
  };

  const so2Config = {
    ...commonConfig,
    title: {
      text: formatTitle('SO<sub>2</sub>'),
      useHTML: true,
    },
    yAxis: {
      title: {
        text: formatYAxis('lb'),
      },
    },
    series: [
      {
        name: 'SO₂',
        data: calculateMonthlyData(data.so2, currentUnit),
        color: '#058dc7',
        unit: 'lb',
      },
    ],
  };

  const noxConfig = {
    ...commonConfig,
    title: {
      text: formatTitle('NO<sub>X</sub>'),
      useHTML: true,
    },
    yAxis: {
      title: {
        text: formatYAxis('lb'),
      },
    },
    series: [
      {
        name: 'NOₓ',
        data: calculateMonthlyData(data.nox, currentUnit),
        color: '#ed561b',
        unit: 'lb',
      },
    ],
  };

  const co2Config = {
    ...commonConfig,
    title: {
      text: formatTitle('CO<sub>2</sub>'),
      useHTML: true,
    },
    yAxis: {
      title: {
        text: formatYAxis('tons'),
      },
    },
    series: [
      {
        name: 'CO₂',
        data: calculateMonthlyData(data.co2, currentUnit),
        color: '#50b432',
        unit: 'tons',
      },
    ],
  };

  const pm25Config = {
    ...commonConfig,
    title: {
      text: formatTitle('PM<sub>2.5</sub>'),
      useHTML: true,
    },
    yAxis: {
      title: {
        text: formatYAxis('lb'),
      },
    },
    series: [
      {
        name: 'PM₂₅',
        data: calculateMonthlyData(data.pm25, currentUnit),
        color: '#665683',
        unit: 'lb',
      },
    ],
  };

  const vocsConfig = {
    ...commonConfig,
    title: {
      text: formatTitle('VOC'),
      useHTML: true,
    },
    yAxis: {
      title: {
        text: formatYAxis('lb'),
      },
    },
    series: [
      {
        name: 'VOC',
        data: calculateMonthlyData(data.vocs, currentUnit),
        color: '#ffc107',
        unit: 'lb',
      },
    ],
  };

  const nh3Config = {
    ...commonConfig,
    title: {
      text: formatTitle('NH<sub>3</sub>'),
      useHTML: true,
    },
    yAxis: {
      title: {
        text: formatYAxis('lb'),
      },
    },
    series: [
      {
        name: 'NH₃',
        data: calculateMonthlyData(data.nh3, currentUnit),
        color: '#009688',
        unit: 'lb',
      },
    ],
  };

  // prettier-ignore
  const pollutantMarkup = new Map<Pollutant, ReactNode>()
      .set('so2', <>SO<sub>2</sub></>)
      .set('nox', <>NO<sub>X</sub></>)
      .set('co2', <>CO<sub>2</sub></>)
      .set('pm25', <>PM<sub>2.5</sub></>)
      .set('vocs', <>VOC</>)
      .set('nh3', <>NH<sub>2</sub></>);

  const chartConfig = new Map<Pollutant, Object>()
    .set('so2', so2Config)
    .set('nox', noxConfig)
    .set('co2', co2Config)
    .set('pm25', pm25Config)
    .set('vocs', vocsConfig)
    .set('nh3', nh3Config);

  if (currentUnit === 'percentages') {
    if (flaggedRegion || flaggedState || flaggedCounty) {
      return (
        <div
          className={
            `margin-bottom-2 padding-2 bg-base-lightest ` +
            `border-width-1px border-solid border-base-light`
          }
        >
          <p className="font-sans-md line-height-sans-2 text-base-darker text-center">
            Change in {pollutantMarkup.get(pollutant)} Emissions:{' '}
            {chartLocationTitle}
          </p>

          <p className="margin-0 font-sans-xs text-base-dark">
            Percent change statistics are not available for{' '}
            {pollutantMarkup.get(pollutant)} because the geographic area you’ve
            selected features one or more power plants with an infrequent{' '}
            {pollutantMarkup.get(pollutant)} emissions event. See Section 2 of
            the <a href="https://www.epa.gov/avert">AVERT User Manual</a> for
            more information.
          </p>
        </div>
      );
    }
  }

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={chartConfig.get(pollutant)}
      callback={(_chart: any) => {
        // as this entire react app is ultimately served in an iframe
        // on another page, this document has a click handler that sends
        // the document's height to other window, which can then set the
        // embedded iframe's height (see public/post-message.js)
        document.querySelector('html')?.click();
      }}
    />
  );
}

export function MonthlyEmissionsCharts() {
  const dispatch = useDispatch();
  const status = useTypedSelector(({ displacement }) => displacement.status);
  const geographicFocus = useTypedSelector(({ geography }) => geography.focus);
  const currentAggregation = useTypedSelector(
    ({ monthlyEmissions }) => monthlyEmissions.aggregation,
  );
  const currentRegionId = useTypedSelector(
    ({ monthlyEmissions }) => monthlyEmissions.regionId,
  );
  const currentStateId = useTypedSelector(
    ({ monthlyEmissions }) => monthlyEmissions.stateId,
  );
  const currentCountyName = useTypedSelector(
    ({ monthlyEmissions }) => monthlyEmissions.countyName,
  );
  const currentUnit = useTypedSelector(
    ({ monthlyEmissions }) => monthlyEmissions.unit,
  );
  const availableStates = useTypedSelector(({ displacement }) => {
    return Object.keys(displacement.statesAndCounties).sort();
  });
  const availableCounties = useTypedSelector(({ displacement }) => {
    return displacement.statesAndCounties[currentStateId as StateId]?.sort();
  });
  const monthlyEmissionChanges = useTypedSelector(
    ({ displacement }) => displacement.monthlyEmissionChanges,
  );

  const selectedRegion = useSelectedRegion();
  const selectedStateRegions = useSelectedStateRegions();

  // set monthlyData for each pollutant, based on selected aggregation
  const initialMonthlyData = {
    month1: { original: 0, postEere: 0 },
    month2: { original: 0, postEere: 0 },
    month3: { original: 0, postEere: 0 },
    month4: { original: 0, postEere: 0 },
    month5: { original: 0, postEere: 0 },
    month6: { original: 0, postEere: 0 },
    month7: { original: 0, postEere: 0 },
    month8: { original: 0, postEere: 0 },
    month9: { original: 0, postEere: 0 },
    month10: { original: 0, postEere: 0 },
    month11: { original: 0, postEere: 0 },
    month12: { original: 0, postEere: 0 },
  };

  const data: { [key in Pollutant]: MonthlyDisplacement } = {
    so2: { ...initialMonthlyData },
    nox: { ...initialMonthlyData },
    co2: { ...initialMonthlyData },
    pm25: { ...initialMonthlyData },
    vocs: { ...initialMonthlyData },
    nh3: { ...initialMonthlyData },
  };

  const regionId =
    geographicFocus === 'regions' && selectedRegion
      ? selectedRegion.id
      : geographicFocus === 'states' && selectedStateRegions.length === 1
      ? selectedStateRegions[0].id
      : (currentRegionId as RegionId);

  const stateId = currentStateId as StateId;

  for (const item of ['so2', 'nox', 'co2', 'pm25', 'vocs', 'nh3']) {
    const pollutant = item as Pollutant;

    if (currentAggregation === 'region') {
      const displacement = monthlyEmissionChanges.regions[pollutant][regionId];
      data[pollutant] = displacement || initialMonthlyData;
    }

    if (currentAggregation === 'state') {
      const displacement = monthlyEmissionChanges.states[pollutant][stateId];
      data[pollutant] = displacement || initialMonthlyData;
    }

    if (currentAggregation === 'county') {
      const displacement = monthlyEmissionChanges.counties[pollutant][stateId]?.[currentCountyName]; // prettier-ignore
      data[pollutant] = displacement || initialMonthlyData;
    }
  }

  // console.log(data); // NOTE: for debugging purposes

  return (
    <>
      <div className="margin-top-2 desktop:display-flex">
        <div className="flex-1 tablet:display-flex desktop:margin-right-1">
          <div className="flex-1 margin-bottom-2 tablet:margin-right-1">
            <div className="avert-box padding-105">
              <p className="avert-box-heading font-serif-2xs line-height-serif-2">
                Select level of aggregation:
              </p>

              <div className="mobile-lg:display-flex">
                <div className="flex-1 mobile-lg:margin-right-1">
                  <div className="usa-radio">
                    <input
                      id="aggregation-region"
                      className="usa-radio__input"
                      type="radio"
                      name="aggregation"
                      value="region"
                      checked={currentAggregation === 'region'}
                      onChange={(_ev) => {
                        dispatch(setMonthlyEmissionsAggregation('region'));
                      }}
                      data-avert-aggregation-toggle="region"
                    />

                    <label
                      className="usa-radio__label"
                      htmlFor="aggregation-region"
                    >
                      Region
                    </label>
                  </div>
                </div>

                <div className="flex-1 mobile-lg:margin-x-1">
                  <div className="usa-radio">
                    <input
                      id="aggregation-state"
                      className="usa-radio__input"
                      type="radio"
                      name="aggregation"
                      value="state"
                      checked={currentAggregation === 'state'}
                      onChange={(_ev) => {
                        dispatch(setMonthlyEmissionsAggregation('state'));
                        if (!currentStateId) return;
                        dispatch(setMonthlyEmissionsStateId(currentStateId));
                      }}
                      data-avert-aggregation-toggle="state"
                    />

                    <label
                      className="usa-radio__label"
                      htmlFor="aggregation-state"
                    >
                      State
                    </label>
                  </div>
                </div>

                <div className="flex-1 tablet:margin-left-1">
                  <div className="usa-radio">
                    <input
                      id="aggregation-county"
                      className="usa-radio__input"
                      type="radio"
                      name="aggregation"
                      value="county"
                      checked={currentAggregation === 'county'}
                      onChange={(_ev) => {
                        dispatch(setMonthlyEmissionsAggregation('county'));
                        if (!currentCountyName) return;
                        dispatch(
                          setMonthlyEmissionsCountyName(currentCountyName),
                        );
                      }}
                      data-avert-aggregation-toggle="county"
                    />

                    <label
                      className="usa-radio__label"
                      htmlFor="aggregation-county"
                    >
                      County
                    </label>
                  </div>
                </div>
              </div>

              <div data-avert-geography-selects>
                {geographicFocus === 'states' &&
                  currentAggregation === 'region' &&
                  selectedStateRegions.length > 1 && (
                    <select
                      className={
                        `usa-select ` +
                        `display-inline-block height-auto maxw-full ` +
                        `margin-top-105 padding-left-1 padding-y-05 padding-right-4 ` +
                        `border-width-1px border-solid border-base-light font-sans-xs`
                      }
                      value={currentRegionId}
                      onChange={(ev) => {
                        dispatch(setMonthlyEmissionsRegionId(ev.target.value));
                      }}
                      data-avert-geography-select="region"
                    >
                      <option value="" disabled>
                        Select Region(s)
                      </option>

                      <option value="ALL">All Affected Regions</option>

                      {selectedStateRegions.map(({ id, name }) => (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      ))}
                    </select>
                  )}

                {(currentAggregation === 'state' ||
                  currentAggregation === 'county') && (
                  <>
                    <select
                      className={
                        `usa-select ` +
                        `display-inline-block height-auto maxw-full ` +
                        `margin-top-105 padding-left-1 padding-y-05 padding-right-4 ` +
                        `border-width-1px border-solid border-base-light font-sans-xs`
                      }
                      value={currentStateId}
                      onChange={(ev) =>
                        dispatch(setMonthlyEmissionsStateId(ev.target.value))
                      }
                      data-avert-geography-select="state"
                    >
                      <option value="" disabled>
                        Select State
                      </option>

                      {availableStates.map((id) => (
                        <option key={id} value={id}>
                          {states[id as StateId].name}
                        </option>
                      ))}
                    </select>

                    {currentAggregation === 'county' && (
                      <select
                        className={
                          `usa-select ` +
                          `display-inline-block height-auto maxw-full ` +
                          `margin-top-105 padding-left-1 padding-y-05 padding-right-4 ` +
                          `border-width-1px border-solid border-base-light font-sans-xs`
                        }
                        value={currentCountyName}
                        onChange={(ev) => {
                          dispatch(setMonthlyEmissionsCountyName(ev.target.value)); // prettier-ignore
                        }}
                        data-avert-geography-select="county"
                      >
                        <option value="" disabled>
                          Select County
                        </option>

                        {availableCounties?.map((county, index) => (
                          <option key={index} value={county}>
                            {/* format 'city' if found in county name */}
                            {county.replace(/city/, '(City)')}
                          </option>
                        ))}
                      </select>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 margin-bottom-2 tablet:margin-left-1">
            <div className="avert-box padding-105">
              <p className="avert-box-heading font-serif-2xs line-height-serif-2">
                Select pollutants:
              </p>

              <div className="display-flex mobile-lg:display-block">
                <div className="flex-1 mobile-lg:display-flex">
                  <div className="flex-1 mobile-lg:margin-right-1">
                    <div className="usa-checkbox">
                      <input
                        id="pollutants-so2"
                        className="usa-checkbox__input"
                        type="checkbox"
                        name="pollutants"
                        value="so2"
                        // checked={true}
                        // onChange={(ev) => {
                        //   const pollutant = ev.target.value as MonthlyPollutant;
                        //   dispatch(selectMonthlyPollutant(pollutant));
                        // }}
                        data-avert-pollutants-checkbox="so2"
                      />
                      <label
                        className="usa-checkbox__label"
                        htmlFor="pollutants-so2"
                      >
                        SO<sub>2</sub>
                      </label>
                    </div>
                  </div>

                  <div className="flex-1 mobile-lg:margin-x-1">
                    <div className="usa-checkbox">
                      <input
                        id="pollutants-nox"
                        className="usa-checkbox__input"
                        type="checkbox"
                        name="pollutants"
                        value="nox"
                        // checked={true}
                        // onChange={(ev) => {
                        //   const pollutant = ev.target.value as MonthlyPollutant;
                        //   dispatch(selectMonthlyPollutant(pollutant));
                        // }}
                        data-avert-pollutants-checkbox="nox"
                      />
                      <label
                        className="usa-checkbox__label"
                        htmlFor="pollutants-nox"
                      >
                        NO<sub>X</sub>
                      </label>
                    </div>
                  </div>

                  <div className="flex-1 tablet:margin-left-1">
                    <div className="usa-checkbox">
                      <input
                        id="pollutants-co2"
                        className="usa-checkbox__input"
                        type="checkbox"
                        name="pollutants"
                        value="co2"
                        // checked={true}
                        // onChange={(ev) => {
                        //   const pollutant = ev.target.value as MonthlyPollutant;
                        //   dispatch(selectMonthlyPollutant(pollutant));
                        // }}
                        data-avert-pollutants-checkbox="co2"
                      />
                      <label
                        className="usa-checkbox__label"
                        htmlFor="pollutants-co2"
                      >
                        CO<sub>2</sub>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex-1 mobile-lg:display-flex">
                  <div className="flex-1 mobile-lg:margin-right-1">
                    <div className="usa-checkbox">
                      <input
                        id="pollutants-pm25"
                        className="usa-checkbox__input"
                        type="checkbox"
                        name="pollutants"
                        value="pm25"
                        // checked={true}
                        // onChange={(ev) => {
                        //   const pollutant = ev.target.value as MonthlyPollutant;
                        //   dispatch(selectMonthlyPollutant(pollutant));
                        // }}
                        data-avert-pollutants-checkbox="pm25"
                      />
                      <label
                        className="usa-checkbox__label"
                        htmlFor="pollutants-pm25"
                      >
                        PM<sub>2.5</sub>
                      </label>
                    </div>
                  </div>

                  <div className="flex-1 mobile-lg:margin-x-1">
                    <div className="usa-checkbox">
                      <input
                        id="pollutants-vocs"
                        className="usa-checkbox__input"
                        type="checkbox"
                        name="pollutants"
                        value="vocs"
                        // checked={true}
                        // onChange={(ev) => {
                        //   const pollutant = ev.target.value as MonthlyPollutant;
                        //   dispatch(selectMonthlyPollutant(pollutant));
                        // }}
                        data-avert-pollutants-checkbox="vocs"
                      />
                      <label
                        className="usa-checkbox__label"
                        htmlFor="pollutants-vocs"
                      >
                        VOCs
                      </label>
                    </div>
                  </div>

                  <div className="flex-1 tablet:margin-left-1">
                    <div className="usa-checkbox">
                      <input
                        id="pollutants-nh3"
                        className="usa-checkbox__input"
                        type="checkbox"
                        name="pollutants"
                        value="nh3"
                        // checked={true}
                        // onChange={(ev) => {
                        //   const pollutant = ev.target.value as MonthlyPollutant;
                        //   dispatch(selectMonthlyPollutant(pollutant));
                        // }}
                        data-avert-pollutants-checkbox="nh3"
                      />
                      <label
                        className="usa-checkbox__label"
                        htmlFor="pollutants-nh3"
                      >
                        NH<sub>3</sub>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 tablet:display-flex desktop:margin-left-1">
          <div className="flex-1 margin-bottom-2 tablet:margin-right-1">
            <div className="avert-box padding-105">
              <p className="avert-box-heading font-serif-2xs line-height-serif-2">
                Select emissions source:
              </p>

              <div className="mobile-lg:display-flex">
                <div className="flex-1 mobile-lg:margin-right-1">
                  <div className="usa-radio">
                    <input
                      id="source-power"
                      className="usa-radio__input"
                      type="radio"
                      name="source"
                      value="power"
                      // checked={selectedSource === 'power'}
                      // onChange={(ev) => {
                      //   const source = ev.target.value as MonthlyUnit;
                      //   dispatch(selectMonthlySource(source));
                      // }}
                      data-avert-source-toggle="power"
                    />

                    <label className="usa-radio__label" htmlFor="source-power">
                      Power sector only
                    </label>
                  </div>
                </div>

                <div className="flex-1 mobile-lg:margin-left-1">
                  <div className="usa-radio">
                    <input
                      id="source-power-vehicles"
                      className="usa-radio__input"
                      type="radio"
                      name="source"
                      value="power-vehicles"
                      // checked={selectedSource === 'power-vehicles'}
                      // onChange={(ev) => {
                      //   const source = ev.target.value as MonthlyUnit;
                      //   dispatch(selectMonthlySource(source));
                      // }}
                      data-avert-source-toggle="power-vehicles"
                    />

                    <label
                      className="usa-radio__label"
                      htmlFor="source-power-vehicles"
                    >
                      Power sector and vehicles
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 margin-bottom-2 tablet:margin-left-1">
            <div className="avert-box padding-105">
              <p className="avert-box-heading font-serif-2xs line-height-serif-2">
                Select units:
              </p>

              <div className="mobile-lg:display-flex">
                <div className="flex-1 mobile-lg:margin-right-1">
                  <div className="usa-radio">
                    <input
                      id="units-emissions"
                      className="usa-radio__input"
                      type="radio"
                      name="units"
                      value="emissions"
                      checked={currentUnit === 'emissions'}
                      onChange={(_ev) => {
                        dispatch(seMonthlyEmissionsUnit('emissions'));
                      }}
                      data-avert-unit-toggle="emissions"
                    />

                    <label
                      className="usa-radio__label"
                      htmlFor="units-emissions"
                    >
                      Emission changes{' '}
                      <span className="text-italic">(lb or tons)</span>
                    </label>
                  </div>
                </div>

                <div className="flex-1 mobile-lg:margin-left-1">
                  <div className="usa-radio">
                    <input
                      id="units-percentages"
                      className="usa-radio__input"
                      type="radio"
                      name="units"
                      value="percentages"
                      checked={currentUnit === 'percentages'}
                      onChange={(_ev) => {
                        dispatch(seMonthlyEmissionsUnit('percentages'));
                      }}
                      data-avert-unit-toggle="percentages"
                    />

                    <label
                      className="usa-radio__label"
                      htmlFor="units-percentages"
                    >
                      Percent change
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={
          `margin-top-2 padding-2 ` +
          `border-width-1px border-solid border-base-light`
        }
      >
        <div className="margin-top-0" data-avert-chart="so2">
          {status === 'complete' && <Chart pollutant="so2" data={data} />}
        </div>

        <div className="margin-top-2" data-avert-chart="nox">
          {status === 'complete' && <Chart pollutant="nox" data={data} />}
        </div>

        <div className="margin-top-2" data-avert-chart="co2">
          {status === 'complete' && <Chart pollutant="co2" data={data} />}
        </div>

        <div className="margin-top-2" data-avert-chart="pm25">
          {status === 'complete' && <Chart pollutant="pm25" data={data} />}
        </div>

        <div className="margin-top-2" data-avert-chart="vocs">
          {status === 'complete' && <Chart pollutant="vocs" data={data} />}
        </div>

        <div className="margin-top-2" data-avert-chart="nh3">
          {status === 'complete' && <Chart pollutant="nh3" data={data} />}
        </div>
      </div>
    </>
  );
}
