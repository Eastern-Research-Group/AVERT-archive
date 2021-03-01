/** @jsxImportSource @emotion/react */

import { ReactNode, Fragment } from 'react';
import { css } from '@emotion/react';
// components
import Tooltip from 'app/components/Tooltip';
// reducers
import { useTypedSelector } from 'app/redux/index';
import { DisplacementPollutant } from 'app/config';

const rowLabelStyles = css`
  padding: 0.375rem 1.25rem !important;
`;

function formatNumber(number: any) {
  if (number < 10 && number > -10) return '--';
  const output = Math.ceil(number / 10) * 10;
  return output.toLocaleString();
}

function DisplacementsTable() {
  const status = useTypedSelector(({ displacement }) => displacement.status);
  const data = useTypedSelector(
    ({ displacement }) => displacement.annualRegionalDisplacements,
  );
  const egusNeedingReplacement = useTypedSelector(
    ({ displacement }) => displacement.egusNeedingReplacement,
  );

  const genOrig = data.generation.replacedOriginal || data.generation.original;
  const genPost = data.generation.replacedPostEere || data.generation.postEere;
  const genImpacts = data.generation.impacts;

  const so2Orig = data.so2.replacedOriginal || data.so2.original;
  const so2Post = data.so2.replacedPostEere || data.so2.postEere;
  const so2Impacts = data.so2.impacts;

  const noxOrig = data.nox.replacedOriginal || data.nox.original;
  const noxPost = data.nox.replacedPostEere || data.nox.postEere;
  const noxImpacts = data.nox.impacts;

  const co2Orig = data.co2.replacedOriginal || data.co2.original;
  const co2Post = data.co2.replacedPostEere || data.co2.postEere;
  const co2Impacts = data.co2.impacts;

  const pm25Orig = data.pm25.replacedOriginal || data.pm25.original;
  const pm25Post = data.pm25.replacedPostEere || data.pm25.postEere;
  const pm25Impacts = data.pm25.impacts;

  function replacementTooltip(
    pollutant: DisplacementPollutant,
    tooltipId: number,
  ) {
    // prettier-ignore
    const pollutantMarkup = new Map<DisplacementPollutant, ReactNode>()
      .set('generation', <Fragment>Generation</Fragment>)
      .set('so2', <Fragment>SO<sub>2</sub></Fragment>)
      .set('nox', <Fragment>NO<sub>X</sub></Fragment>)
      .set('co2', <Fragment>CO<sub>2</sub></Fragment>)
      .set('pm25', <Fragment>PM<sub>2.5</sub></Fragment>);

    return (
      <Tooltip id={tooltipId}>
        This region features one or more power plants with an infrequent{' '}
        {pollutantMarkup.get(pollutant)} emissions event.{' '}
        {pollutantMarkup.get(pollutant)} emissions changes from these plants are
        not included in this analysis. See Section 2 of the{' '}
        <a href="https://www.epa.gov/avert">AVERT User Manual</a> for more
        information.
      </Tooltip>
    );
  }

  if (status !== 'complete') return null;

  return (
    <Fragment>
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
            <td css={rowLabelStyles}>
              Generation (MWh){' '}
              {egusNeedingReplacement.generation.length > 0 &&
                replacementTooltip('generation', 30)}
            </td>
            <td className="avert-table-data">{formatNumber(genOrig)}</td>
            <td className="avert-table-data">{formatNumber(genPost)}</td>
            <td className="avert-table-data">{formatNumber(genImpacts)}</td>
          </tr>
          <tr className="avert-table-group">
            <td colSpan={4}>Total emissions of fossil EGUs</td>
          </tr>
          <tr>
            <td css={rowLabelStyles}>
              SO<sub>2</sub> (lbs){' '}
              {egusNeedingReplacement.so2.length > 0 &&
                replacementTooltip('so2', 31)}
            </td>
            <td className="avert-table-data">{formatNumber(so2Orig)}</td>
            <td className="avert-table-data">{formatNumber(so2Post)}</td>
            <td className="avert-table-data">{formatNumber(so2Impacts)}</td>
          </tr>
          <tr>
            <td css={rowLabelStyles}>
              NO<sub>X</sub> (lbs){' '}
              {egusNeedingReplacement.nox.length > 0 &&
                replacementTooltip('nox', 32)}
            </td>
            <td className="avert-table-data">{formatNumber(noxOrig)}</td>
            <td className="avert-table-data">{formatNumber(noxPost)}</td>
            <td className="avert-table-data">{formatNumber(noxImpacts)}</td>
          </tr>
          <tr>
            <td css={rowLabelStyles}>
              CO<sub>2</sub> (tons){' '}
              {egusNeedingReplacement.co2.length > 0 &&
                replacementTooltip('co2', 33)}
            </td>
            <td className="avert-table-data">{formatNumber(co2Orig)}</td>
            <td className="avert-table-data">{formatNumber(co2Post)}</td>
            <td className="avert-table-data">{formatNumber(co2Impacts)}</td>
          </tr>
          <tr>
            <td css={rowLabelStyles}>
              PM<sub>2.5</sub> (lbs){' '}
              {egusNeedingReplacement.pm25.length > 0 &&
                replacementTooltip('pm25', 34)}
            </td>
            <td className="avert-table-data">{formatNumber(pm25Orig)}</td>
            <td className="avert-table-data">{formatNumber(pm25Post)}</td>
            <td className="avert-table-data">{formatNumber(pm25Impacts)}</td>
          </tr>
          <tr className="avert-table-group">
            <td colSpan={4}>Emission rates of fossil EGUs</td>
          </tr>
          <tr>
            <td css={rowLabelStyles}>
              SO<sub>2</sub> (lbs/MWh)
            </td>
            <td className="avert-table-data">
              {(so2Orig / genOrig).toFixed(3)}
            </td>
            <td className="avert-table-data">
              {(so2Post / genPost).toFixed(3)}
            </td>
            <td className="avert-table-data">&nbsp;</td>
          </tr>
          <tr>
            <td css={rowLabelStyles}>
              NO<sub>X</sub> (lbs/MWh)
            </td>
            <td className="avert-table-data">
              {(noxOrig / genOrig).toFixed(3)}
            </td>
            <td className="avert-table-data">
              {(noxPost / genPost).toFixed(3)}
            </td>
            <td className="avert-table-data">&nbsp;</td>
          </tr>
          <tr>
            <td css={rowLabelStyles}>
              CO<sub>2</sub> (tons/MWh)
            </td>
            <td className="avert-table-data">
              {(co2Orig / genOrig).toFixed(3)}
            </td>
            <td className="avert-table-data">
              {(co2Post / genPost).toFixed(3)}
            </td>
            <td className="avert-table-data">&nbsp;</td>
          </tr>
          <tr>
            <td css={rowLabelStyles}>
              PM<sub>2.5</sub> (lbs/MWh)
            </td>
            <td className="avert-table-data">
              {(pm25Orig / genOrig).toFixed(3)}
            </td>
            <td className="avert-table-data">
              {(pm25Post / genPost).toFixed(3)}
            </td>
            <td className="avert-table-data">&nbsp;</td>
          </tr>
        </tbody>
      </table>

      <p className="avert-small-text">
        Negative numbers indicate displaced generation and emissions. All
        results are rounded to the nearest ten. A dash ('–') indicates a result
        greater than zero, but lower than the level of reportable significance.
      </p>
    </Fragment>
  );
}

export default DisplacementsTable;
