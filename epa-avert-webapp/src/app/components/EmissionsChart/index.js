// @flow
/* eslint-disable import/first */

import React from 'react';
import Highcharts from 'react-highcharts';
// enums
import States from 'app/enums/States';
// styles
import './styles.css';

type Props = {
  heading: string,
  // redux connected props
  monthlyStatus: string,
  aggregation: 'region' | 'state' | 'county',
  unit: 'emissions' | 'percentages',
  availableStates: Array<string>,
  availableCounties: Array<string>,
  selectedRegion: string,
  selectedState: string,
  selectedCounty: string,
  output: {
    so2: Array<number>,
    nox: Array<number>,
    co2: Array<number>,
    pm25: Array<number>,
  },
  onAggregationChange: (string) => void,
  onUnitChange: (string) => void,
  selectState: (string) => void,
  selectCounty: (string) => void,
};

const EmissionsChart = (props: Props) => {
  const {
    heading,
    monthlyStatus,
    aggregation,
    unit,
    availableStates,
    availableCounties,
    selectedRegion,
    selectedState,
    selectedCounty,
    output,
    onAggregationChange,
    onUnitChange,
    selectState,
    selectCounty,
  } = props;

  // rendering is ready when output prop has data
  const readyToRender = monthlyStatus === 'complete';

  // callback for after highcharts chart renders
  const afterRender = (chart) => {
    // as this entire react app is ultimately served in an iframe on another page,
    // this document has a click handler that sends document's height to other window,
    // which can then set the embedded iframe's height (see public/post-message.js)
    //$FlowFixMe: surpressing Flow error
    document.querySelector('html').click();
  };

  let AggregationFilter;
  if (readyToRender) {
    AggregationFilter = (
      <div className="avert-inline-select" id="geography-groups">
        <p>Select level of aggregation:</p>

        <label>
          <input
            type="radio"
            name="aggregation"
            value={'region'}
            checked={aggregation === 'region'}
            onChange={(e) => onAggregationChange(e.target.value)}
          />
          Region
        </label>

        <label>
          <input
            type="radio"
            name="aggregation"
            value={'state'}
            checked={aggregation === 'state'}
            onChange={(event) => {
              onAggregationChange(event.target.value);
              if (selectedState) selectState(selectedState);
            }}
          />
          State
        </label>

        <label>
          <input
            type="radio"
            name="aggregation"
            value={'county'}
            checked={aggregation === 'county'}
            onChange={(event) => {
              onAggregationChange(event.target.value);
              if (selectedCounty) selectCounty(selectedCounty);
            }}
          />
          County
        </label>
      </div>
    );
  }

  let StateSelector;
  if (aggregation === 'state' || aggregation === 'county') {
    StateSelector = (
      <div className="avert-select-group">
        <select
          value={selectedState}
          onChange={(event) => selectState(event.target.value)}
        >
          <option value="" disabled>
            Select State
          </option>

          {availableStates.map((state, index) => (
            <option key={index} value={state}>
              {States[state]}
            </option>
          ))}
        </select>
      </div>
    );
  }

  let CountySelector;
  if (aggregation === 'county') {
    CountySelector = (
      <div className="avert-select-group">
        <select
          value={selectedCounty}
          onChange={(event) => selectCounty(event.target.value)}
        >
          <option value="" disabled>
            Select County
          </option>

          {availableCounties.map((county, index) => (
            <option key={index} value={county}>
              {county}
            </option>
          ))}
        </select>
      </div>
    );
  }

  let GeographyFilter;
  if (readyToRender) {
    GeographyFilter = (
      <div className="avert-geography-filter">
        {StateSelector}
        {CountySelector}
      </div>
    );
  }

  let UnitFilter;
  if (readyToRender) {
    UnitFilter = (
      <div className="avert-inline-select">
        <p>Select units:</p>

        <label>
          <input
            type="radio"
            name="unit"
            value={'emissions'}
            checked={unit === 'emissions'}
            onChange={(e) => onUnitChange(e.target.value)}
          />
          Emission changes (lbs or tons)
        </label>

        <label>
          <input
            type="radio"
            name="unit"
            value={'percentages'}
            checked={unit === 'percentages'}
            onChange={(e) => onUnitChange(e.target.value)}
          />
          Percent change
        </label>
      </div>
    );
  }

  // charts config
  const commonConfig = {
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
      // pointFormat: '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y}</b><br/>',
      pointFormatter: function() {
        return (
          `<span style="color:${this.color}">\u25CF</span> ` +
          `${this.series.yAxis.axisTitle.textStr}: ` +
          `<b>${Math.round(this.y).toLocaleString()}</b><br/>`
        );
      },
    },
    lang: {
      hoverText: 'Export options',
    },
    exporting: {
      buttons: {
        contextButton: {
          _titleKey: 'hoverText',
        },
      },
    },
    xAxis: {
      categories: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
    },
  };

  let location;
  // prettier-ignore
  if (aggregation === 'region') {
    location = `${selectedRegion} Region`;
  }
  // prettier-ignore
  if (aggregation === 'state') {
    location = (selectedState === '')
      ? ''
      : `${States[selectedState]}`;
  }
  // prettier-ignore
  if (aggregation === 'county') {
    // counties are called parishes in Louisiana
    const county = (selectedState === 'LA') ? 'Parish' : 'County';
    location = (selectedCounty === '')
      ? ''
      : `${selectedCounty} ${county}, ${States[selectedState]}`;
  }

  const formatTitle = (chemical) =>
    `<tspan class='avert-chart-title'>Change in ${chemical} Emissions: ${location}</tspan>`;

  // prettier-ignore
  const formatYAxis = (emissionsUnit) =>
    (unit === 'percentages')
      ? 'Percent change'
      : `Emission changes (${emissionsUnit})`;

  const so2Config = {
    ...commonConfig,
    title: {
      text: formatTitle('SO<sub>2</sub>'),
      useHTML: true,
    },
    yAxis: {
      title: {
        text: formatYAxis('lbs'),
      },
    },
    series: [
      {
        name: 'SO₂',
        data: output.so2,
        color: '#058dc7',
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
        text: formatYAxis('lbs'),
      },
    },
    series: [
      {
        name: 'NOₓ',
        data: output.nox,
        color: '#ed561b',
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
        data: output.co2,
        color: '#50b432',
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
        text: formatYAxis('lbs'),
      },
    },
    series: [
      {
        name: 'PM₂₅',
        data: output.pm25,
        color: '#665683',
      },
    ],
  };

  let Charts;
  if (readyToRender) {
    Charts = (
      <div className="avert-emissions-charts">
        <Highcharts config={so2Config} callback={afterRender} />
        <Highcharts config={noxConfig} callback={afterRender} />
        <Highcharts config={co2Config} callback={afterRender} />
        <Highcharts config={pm25Config} callback={afterRender} />
      </div>
    );
  }

  return (
    <div className="avert-emissions-chart">
      <h3 className="avert-heading-three">{heading}</h3>

      {AggregationFilter}
      {GeographyFilter}
      {UnitFilter}
      {Charts}
    </div>
  );
};

export default EmissionsChart;
