'use strict';

module.exports = (function () {
  function MonthlyEmissions () {
    this.generation = {
      emissions: { region: {}, state: {}, county: {} },
      percentages: { region: {}, state: {}, county: {} },
    };

    this.so2 = {
      emissions: { region: {}, state: {}, county: {} },
      percentages: { region: {}, state: {}, county: {} },
    };

    this.nox = {
      emissions: { region: {}, state: {}, county: {} },
      percentages: { region: {}, state: {}, county: {} },
    };

    this.co2 = {
      emissions: { region: {}, state: {}, county: {} },
      percentages: { region: {}, state: {}, county: {} },
    };

    this.count = 0;
  }

  MonthlyEmissions.prototype.addRegion = function (type, emissionsOrPercentages, month, data) {
    let value = this[type][emissionsOrPercentages].region[month];

    if (typeof value === 'undefined') value = 0;

    value += data;
  };

  MonthlyEmissions.prototype.addState = function (type, emissionsOrPercentages, state, month, data) {
    this.count ++;

    let value = this[type][emissionsOrPercentages].state[state];

    if (typeof value === 'undefined') value = {};
    if (typeof value[month] === 'undefined') value[month] = 0;

    value[month] += data;
  };

  MonthlyEmissions.prototype.addCounty = function (type, emissionsOrPercentages, state, county, month, data) {
    let value = this[type][emissionsOrPercentages].county[state];

    if (typeof value === 'undefined') value = {};
    if (typeof value[county] === 'undefined') value[county] = {};
    if (typeof value[county][month] === 'undefined') value[county][month] = 0;

    value[county][month] += data;
  };

  return MonthlyEmissions;
})();
