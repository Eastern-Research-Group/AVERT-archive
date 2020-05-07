import React from 'react';
// reducers
import { useAnnualDisplacementState } from 'app/redux/annualDisplacement';
// styles
import './styles.css';

const formatOutput = (number: any) => {
  if (number < 10 && number > -10) return '--';
  let output = Math.ceil(number / 10) * 10;
  return output.toLocaleString();
};

const formatNumber = (number: any) => {
  if (number === 0) return '---';
  return parseFloat(number).toFixed(2); // always display two decimal places
};

type Props = {
  heading: string;
};

const DisplacementsTable = ({ heading }: Props) => {
  const annualStatus = useAnnualDisplacementState(({ status }) => status);
  const generation = useAnnualDisplacementState(
    ({ results }) => results?.generation,
  );
  const totalEmissions = useAnnualDisplacementState(
    ({ results }) => results?.totalEmissions,
  );
  const emissionRates = useAnnualDisplacementState(
    ({ results }) => results?.emissionRates,
  );

  // rendering is ready when state annual displacement status is 'complete'
  const readyToRender = annualStatus === 'complete';

  let table;
  // conditionally re-define table when ready to render
  if (readyToRender) {
    table = (
      <div>
        <table className="avert-table">
          <thead>
            <tr>
              <th>&nbsp;</th>
              <th>Original</th>
              <th>Post-EE/RE</th>
              <th>EE/RE Impacts</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Generation (MWh)</td>
              <td className="avert-table-data">
                {formatOutput(generation.original)}
              </td>
              <td className="avert-table-data">
                {formatOutput(generation.post)}
              </td>
              <td className="avert-table-data">
                {formatOutput(generation.impact)}
              </td>
            </tr>
            <tr className="avert-table-group">
              <td colSpan={4}>Total emissions of fossil EGUs</td>
            </tr>
            <tr>
              <td>
                SO<sub>2</sub> (lbs)
              </td>
              <td className="avert-table-data">
                {formatOutput(totalEmissions.so2.original)}
              </td>
              <td className="avert-table-data">
                {formatOutput(totalEmissions.so2.post)}
              </td>
              <td className="avert-table-data">
                {formatOutput(totalEmissions.so2.impact)}
              </td>
            </tr>
            <tr>
              <td>
                NO<sub>X</sub> (lbs)
              </td>
              <td className="avert-table-data">
                {formatOutput(totalEmissions.nox.original)}
              </td>
              <td className="avert-table-data">
                {formatOutput(totalEmissions.nox.post)}
              </td>
              <td className="avert-table-data">
                {formatOutput(totalEmissions.nox.impact)}
              </td>
            </tr>
            <tr>
              <td>
                CO<sub>2</sub> (tons)
              </td>
              <td className="avert-table-data">
                {formatOutput(totalEmissions.co2.original)}
              </td>
              <td className="avert-table-data">
                {formatOutput(totalEmissions.co2.post)}
              </td>
              <td className="avert-table-data">
                {formatOutput(totalEmissions.co2.impact)}
              </td>
            </tr>
            <tr>
              <td>
                PM<sub>2.5</sub> (lbs)
              </td>
              <td className="avert-table-data">
                {formatOutput(totalEmissions.pm25.original)}
              </td>
              <td className="avert-table-data">
                {formatOutput(totalEmissions.pm25.post)}
              </td>
              <td className="avert-table-data">
                {formatOutput(totalEmissions.pm25.impact)}
              </td>
            </tr>
            <tr className="avert-table-group">
              <td colSpan={4}>Emission rates of fossil EGUs</td>
            </tr>
            <tr>
              <td>
                SO<sub>2</sub> (lbs/MWh)
              </td>
              <td className="avert-table-data">
                {formatNumber(emissionRates.so2.original)}
              </td>
              <td className="avert-table-data">
                {formatNumber(emissionRates.so2.post)}
              </td>
              <td className="avert-table-data">&nbsp;</td>
            </tr>
            <tr>
              <td>
                NO<sub>X</sub> (lbs/MWh)
              </td>
              <td className="avert-table-data">
                {formatNumber(emissionRates.nox.original)}
              </td>
              <td className="avert-table-data">
                {formatNumber(emissionRates.nox.post)}
              </td>
              <td className="avert-table-data">&nbsp;</td>
            </tr>
            <tr>
              <td>
                CO<sub>2</sub> (tons/MWh)
              </td>
              <td className="avert-table-data">
                {formatNumber(emissionRates.co2.original)}
              </td>
              <td className="avert-table-data">
                {formatNumber(emissionRates.co2.post)}
              </td>
              <td className="avert-table-data">&nbsp;</td>
            </tr>
            <tr>
              <td>
                PM<sub>2.5</sub> (lbs/MWh)
              </td>
              <td className="avert-table-data">
                {formatNumber(emissionRates.pm25.original)}
              </td>
              <td className="avert-table-data">
                {formatNumber(emissionRates.pm25.post)}
              </td>
              <td className="avert-table-data">&nbsp;</td>
            </tr>
          </tbody>
        </table>

        <p className="avert-small-text">
          Negative numbers indicate displaced generation and emissions. All
          results are rounded to the nearest ten. A dash ('–') indicates a
          result greater than zero, but lower than the level of reportable
          significance.
        </p>
      </div>
    );
  }

  return (
    <div className="avert-displacement-table">
      <h3 className="avert-heading-three">{heading}</h3>
      {table}
    </div>
  );
};

export default DisplacementsTable;
