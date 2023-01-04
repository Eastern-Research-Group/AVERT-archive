/** @jsxImportSource @emotion/react */

import { useEffect } from 'react';
import { css } from '@emotion/react';
import { useDispatch } from 'react-redux';
// ---
import { EERETextInput } from 'app/components/EERETextInput';
import { EERESelectInput } from 'app/components/EERESelectInput';
import {
  EVSalesAndStockTable,
  EEREEVComparisonTable,
} from 'app/components/EVTables';
import { Tooltip } from 'app/components/Tooltip';
import { useTypedSelector } from 'app/redux/index';
import {
  updateEereAnnualGwh,
  updateEereConstantMw,
  updateEereBroadBasedProgram,
  updateEereReduction,
  updateEereTopHours,
  updateEereOnshoreWind,
  updateEereOffshoreWind,
  updateEereUtilitySolar,
  updateEereRooftopSolar,
  updateEereBatteryEVs,
  updateEereHybridEVs,
  updateEereTransitBuses,
  updateEereSchoolBuses,
  updateEereEVDeploymentLocation,
  updateEereEVModelYear,
  updateEereICEReplacementVehicle,
  calculateEereProfile,
} from 'app/redux/reducers/eere';
import { useSelectedRegion, useSelectedStateRegions } from 'app/hooks';

const inputsGroupStyles = css`
  ul {
    margin-bottom: 0;
  }

  /* highlight letter when details is open */
  &[open] > summary::before {
    background-color: rgb(0, 164, 200); // avert-light-blue
  }
`;

const inputsSummaryStyles = css`
  /* letter (A, B, C, D, or E) */
  &::before {
    content: attr(data-label);
    flex-shrink: 0;
    margin-right: 0.5rem;
    border-radius: 3px;
    width: 1.75rem;
    font-size: 1.5rem;
    line-height: 2rem;
    text-align: center;
    text-shadow: 0 0 4px rgba(0, 0, 0, 0.125);
    color: white;
    background-color: #a9aeb1; // base-light
  }

  /* highlight letter on hover */
  &:hover::before {
    background-color: rgb(0, 164, 200); // avert-light-blue
  }
`;

export function EEREInputs() {
  const dispatch = useDispatch();
  const geographicFocus = useTypedSelector(({ geography }) => geography.focus);
  const status = useTypedSelector(({ eere }) => eere.status);
  const errors = useTypedSelector(({ eere }) => eere.errors);
  const constantMwh = useTypedSelector(({ eere }) => eere.inputs.constantMwh);
  const annualGwh = useTypedSelector(({ eere }) => eere.inputs.annualGwh);
  const broadProgram = useTypedSelector(({ eere }) => eere.inputs.broadProgram);
  const reduction = useTypedSelector(({ eere }) => eere.inputs.reduction);
  const topHours = useTypedSelector(({ eere }) => eere.inputs.topHours);
  const onshoreWind = useTypedSelector(({ eere }) => eere.inputs.onshoreWind);
  const offshoreWind = useTypedSelector(({ eere }) => eere.inputs.offshoreWind);
  const utilitySolar = useTypedSelector(({ eere }) => eere.inputs.utilitySolar);
  const rooftopSolar = useTypedSelector(({ eere }) => eere.inputs.rooftopSolar);
  const batteryEVs = useTypedSelector(({ eere }) => eere.inputs.batteryEVs);
  const hybridEVs = useTypedSelector(({ eere }) => eere.inputs.hybridEVs);
  const transitBuses = useTypedSelector(({ eere }) => eere.inputs.transitBuses);
  const schoolBuses = useTypedSelector(({ eere }) => eere.inputs.schoolBuses);
  const evDeploymentLocation = useTypedSelector(
    ({ eere }) => eere.inputs.evDeploymentLocation,
  );
  const evModelYear = useTypedSelector(({ eere }) => eere.inputs.evModelYear);
  const iceReplacementVehicle = useTypedSelector(
    ({ eere }) => eere.inputs.iceReplacementVehicle,
  );
  const evModelYearOptions = useTypedSelector(
    ({ eere }) => eere.selectOptions.evModelYearOptions,
  );
  const iceReplacementVehicleOptions = useTypedSelector(
    ({ eere }) => eere.selectOptions.iceReplacementVehicleOptions,
  );
  const evDeploymentLocationOptions = useTypedSelector(
    ({ eere }) => eere.selectOptions.evDeploymentLocationOptions,
  );

  const selectedRegion = useSelectedRegion();
  const selectedStateRegions = useSelectedStateRegions();

  // initially set `evDeploymentLocation` to the first calculated location option
  useEffect(() => {
    dispatch(updateEereEVDeploymentLocation(evDeploymentLocationOptions[0].id));
  }, [dispatch, evDeploymentLocationOptions]);

  const atLeastOneRegionSupportsOffshoreWind =
    geographicFocus === 'regions'
      ? selectedRegion?.offshoreWind
      : selectedStateRegions.some((region) => region.offshoreWind);

  const textInputsAreValid = errors.length === 0;

  // text input values from fields
  const textInputsFields = [
    constantMwh,
    annualGwh,
    broadProgram,
    reduction,
    topHours,
    onshoreWind,
    offshoreWind,
    utilitySolar,
    rooftopSolar,
    batteryEVs,
    hybridEVs,
    transitBuses,
    schoolBuses,
  ];

  const textInputsAreEmpty =
    textInputsFields.filter((field) => field?.length > 0).length === 0;

  const calculationDisabled =
    !textInputsAreValid || textInputsAreEmpty || status === 'started';

  const eereButtonOptions = {
    ready: 'Calculate EE/RE Impacts',
    started: 'Calculating...',
    complete: 'Recalculate EE/RE Impacts',
  };

  return (
    <>
      <div
        className={
          `margin-y-2 ` +
          `border-width-1px border-x-width-0 border-bottom-width-0 border-solid border-base-light ` +
          `font-sans-xs text-base-darker`
        }
        data-avert-eere-inputs
      >
        <header
          className={
            `padding-y-1 padding-x-105 ` +
            `border-width-1px border-top-width-0 border-solid border-base-light ` +
            `text-bold bg-base-lightest`
          }
        >
          <p className="margin-0">Energy Efficiency</p>
        </header>

        <details
          css={inputsGroupStyles}
          className="border-width-1px border-top-width-0 border-solid border-base-light"
        >
          <summary
            css={inputsSummaryStyles}
            className={
              `display-flex flex-align-center padding-105 ` +
              `line-height-sans-2 text-bold cursor-pointer`
            }
            data-label="A"
          >
            Reductions spread evenly throughout the year
          </summary>

          <section className="padding-top-0 padding-x-2 padding-bottom-105">
            <p className="margin-0">
              <strong>Choose one:</strong>
            </p>

            <ul className="margin-0 padding-left-3">
              <li className="margin-0">
                <EERETextInput
                  label="Reduce total annual generation by:"
                  ariaLabel="Number of GWh expected to be saved in a single year"
                  suffix="GWh"
                  value={annualGwh}
                  fieldName="annualGwh"
                  disabled={constantMwh}
                  onChange={(text) => dispatch(updateEereAnnualGwh(text))}
                  tooltip={
                    <>
                      Enter the total number of GWh expected to be saved in a
                      single year. This option simply distributes the total
                      annual savings evenly over all hours of the year. An
                      industrial or refrigeration efficiency program may be well
                      represented by a constant reduction across most hours of
                      the year.
                    </>
                  }
                />
              </li>

              <li className="margin-0">
                <EERETextInput
                  label="Reduce hourly generation by:"
                  ariaLabel="Constant reduction for every hour of the year, in MW"
                  suffix="MW"
                  value={constantMwh}
                  fieldName="constantMwh"
                  disabled={annualGwh}
                  onChange={(text) => dispatch(updateEereConstantMw(text))}
                  tooltip={
                    <>
                      “Reduce hourly generation” is identical in effect to
                      reducing total annual generation. It allows you to enter a
                      constant reduction for every hour of the year, in MW. An
                      industrial or refrigeration efficiency program may be well
                      represented by a constant reduction across most hours of
                      the year.
                    </>
                  }
                />
              </li>
            </ul>
          </section>
        </details>

        <details
          css={inputsGroupStyles}
          className="border-width-1px border-top-width-0 border-solid border-base-light"
        >
          <summary
            css={inputsSummaryStyles}
            className={
              `display-flex flex-align-center padding-105 ` +
              `line-height-sans-2 text-bold cursor-pointer`
            }
            data-label="B"
          >
            Percentage reductions in some or all hours
          </summary>

          <section className="padding-top-0 padding-x-2 padding-bottom-105">
            <p className="margin-0">
              <strong>Choose one:</strong>
            </p>

            <ul className="margin-0 padding-left-3">
              <li className="margin-0">
                <EERETextInput
                  label="Broad-based program: Reduce generation by:"
                  ariaLabel="Load reduction percentage applied to all hours of the year"
                  suffix="% in all hours"
                  value={broadProgram}
                  fieldName="broadProgram"
                  disabled={reduction || topHours}
                  onChange={(text) =>
                    dispatch(updateEereBroadBasedProgram(text))
                  }
                  tooltip={
                    <>
                      To simulate a broad-based efficiency program, enter an
                      estimated load reduction fraction. This percentage
                      reduction will be applied to all hours of the year.
                    </>
                  }
                />
              </li>

              <li className="margin-0">
                <EERETextInput
                  label="Targeted program: Reduce generation by:"
                  ariaLabel="Load reduction (as a fraction of peaking load) that would be targeted"
                  suffix="% during the peak:"
                  value={reduction}
                  fieldName="reduction"
                  disabled={broadProgram}
                  onChange={(text) => dispatch(updateEereReduction(text))}
                />

                <EERETextInput
                  ariaLabel="Fraction of high-demand hours that the program is expected to affect"
                  suffix="% of hours"
                  value={topHours}
                  fieldName="topHours"
                  disabled={broadProgram}
                  onChange={(text) => dispatch(updateEereTopHours(text))}
                  tooltip={
                    <>
                      To simulate a peak-reduction targeting program such as
                      demand response, enter the load reduction (as a fraction
                      of peaking load) that would be targeted, as well as the
                      fraction of high-demand hours that the program is expected
                      to affect (e.g., 1%–3%).
                    </>
                  }
                />
              </li>
            </ul>
          </section>
        </details>

        <header
          className={
            `padding-y-1 padding-x-105 ` +
            `border-width-1px border-top-width-0 border-solid border-base-light ` +
            `text-bold bg-base-lightest`
          }
        >
          <p className="margin-0">Renewable Energy</p>
        </header>

        <details
          css={inputsGroupStyles}
          className="border-width-1px border-top-width-0 border-solid border-base-light"
        >
          <summary
            css={inputsSummaryStyles}
            className={
              `display-flex flex-align-center padding-105 ` +
              `line-height-sans-2 text-bold cursor-pointer`
            }
            data-label="C"
          >
            Wind
          </summary>

          <section className="padding-top-0 padding-x-2 padding-bottom-105">
            <p className="margin-0">
              <EERETextInput
                label="Onshore wind total capacity:"
                ariaLabel="Total capacity (maximum potential electricity generation) in MW"
                suffix="MW"
                value={onshoreWind}
                fieldName="onshoreWind"
                onChange={(text) => dispatch(updateEereOnshoreWind(text))}
                tooltip={
                  <>
                    Enter the total capacity (maximum potential electricity
                    generation) for this type of resource, measured in MW. The
                    model uses these inputs along with hourly capacity factors
                    that vary by resource type and region.
                  </>
                }
              />
            </p>

            <p className="margin-0">
              {atLeastOneRegionSupportsOffshoreWind ? (
                <EERETextInput
                  label="Offshore wind total capacity:"
                  ariaLabel="Total capacity (maximum potential electricity generation) in MW"
                  suffix="MW"
                  value={offshoreWind}
                  fieldName="offshoreWind"
                  onChange={(text) => dispatch(updateEereOffshoreWind(text))}
                  tooltip={
                    <>
                      Enter the total capacity (maximum potential electricity
                      generation) for this type of resource, measured in MW. The
                      model uses these inputs along with hourly capacity factors
                      that vary by resource type and region.
                    </>
                  }
                />
              ) : geographicFocus === 'regions' ? (
                <span className="display-block">
                  <em>
                    Offshore wind calculations are not available in this AVERT
                    region{' '}
                  </em>

                  <Tooltip id="no-offshoreWind-region">
                    AVERT does not support offshore wind modeling in this
                    region. It is unlikely that offshore areas suitable for wind
                    farms would connect to the electrical grid in this region.
                  </Tooltip>
                </span>
              ) : (
                <span className="display-block">
                  <em>
                    Offshore wind calculations are not available in the AVERT
                    region(s) that this state is part of{' '}
                  </em>

                  <Tooltip id="no-offshoreWind-state">
                    AVERT does not support offshore wind modeling in the
                    region(s) that this state is part of. It is unlikely that
                    offshore areas suitable for wind farms would connect to the
                    electrical grid in these regions.
                  </Tooltip>
                </span>
              )}
            </p>
          </section>
        </details>

        <details
          css={inputsGroupStyles}
          className="border-width-1px border-top-width-0 border-solid border-base-light"
        >
          <summary
            css={inputsSummaryStyles}
            className={
              `display-flex flex-align-center padding-105 ` +
              `line-height-sans-2 text-bold cursor-pointer`
            }
            data-label="D"
          >
            Solar photovoltaic
          </summary>

          <section className="padding-top-0 padding-x-2 padding-bottom-105">
            <p className="margin-0">
              <EERETextInput
                label="Utility-scale solar photovoltaic total capacity:"
                ariaLabel="Total capacity (maximum potential electricity generation) in MW"
                suffix="MW"
                value={utilitySolar}
                fieldName="utilitySolar"
                onChange={(text) => dispatch(updateEereUtilitySolar(text))}
                tooltip={
                  <>
                    Enter the total capacity (maximum potential electricity
                    generation) for this type of resource, measured in MW. The
                    model uses these inputs along with hourly capacity factors
                    that vary by resource type and region.
                  </>
                }
              />
            </p>

            <p className="margin-0">
              <EERETextInput
                label="Distributed (rooftop) solar photovoltaic total capacity:"
                ariaLabel="Total capacity (maximum potential electricity generation) in MW"
                suffix="MW"
                value={rooftopSolar}
                fieldName="rooftopSolar"
                onChange={(text) => dispatch(updateEereRooftopSolar(text))}
                tooltip={
                  <>
                    Enter the total capacity (maximum potential electricity
                    generation) for this type of resource, measured in MW. The
                    model uses these inputs along with hourly capacity factors
                    that vary by resource type and region.
                  </>
                }
              />
            </p>
          </section>
        </details>

        <header
          className={
            `padding-y-1 padding-x-105 ` +
            `border-width-1px border-top-width-0 border-solid border-base-light ` +
            `text-bold bg-base-lightest`
          }
        >
          <p className="margin-0">Electric Vehicles</p>
        </header>

        <details
          css={inputsGroupStyles}
          className="border-width-1px border-top-width-0 border-solid border-base-light"
        >
          <summary
            css={inputsSummaryStyles}
            className={
              `display-flex flex-align-center padding-105 ` +
              `line-height-sans-2 text-bold cursor-pointer`
            }
            data-label="E"
          >
            Electric Vehicles
          </summary>

          <section className="padding-top-0 padding-x-2 padding-bottom-105">
            <p className="margin-0">
              <EERETextInput
                label="Light-duty battery EVs:"
                ariaLabel="TODO"
                value={batteryEVs}
                fieldName="batteryEVs"
                onChange={(text) => dispatch(updateEereBatteryEVs(text))}
                tooltip={<>TODO</>}
              />
            </p>

            <p className="margin-0">
              <EERETextInput
                label="Light-duty plug-in hybrid EVs:"
                ariaLabel="TODO"
                value={hybridEVs}
                fieldName="hybridEVs"
                onChange={(text) => dispatch(updateEereHybridEVs(text))}
                tooltip={<>TODO</>}
              />
            </p>

            <p className="margin-0">
              <EERETextInput
                label="Electric transit buses:"
                ariaLabel="TODO"
                value={transitBuses}
                fieldName="transitBuses"
                onChange={(text) => dispatch(updateEereTransitBuses(text))}
                tooltip={<>TODO</>}
              />
            </p>

            <p className="margin-0">
              <EERETextInput
                label="Electric school buses:"
                ariaLabel="TODO"
                value={schoolBuses}
                fieldName="schoolBuses"
                onChange={(text) => dispatch(updateEereSchoolBuses(text))}
                tooltip={<>TODO</>}
              />
            </p>

            <hr
              className={
                `margin-y-105 ` +
                `border-width-1px border-x-width-0 border-bottom-width-0 border-solid border-base-light`
              }
            />

            <p className="margin-0">
              <label htmlFor="evDeploymentLocation">
                Location of EV deployment:
              </label>

              <EERESelectInput
                ariaLabel="TODO"
                options={evDeploymentLocationOptions}
                value={evDeploymentLocation}
                fieldName="evDeploymentLocation"
                onChange={(option) =>
                  dispatch(updateEereEVDeploymentLocation(option))
                }
              />

              <Tooltip id="evDeploymentLocation">
                <>TODO</>
              </Tooltip>
            </p>

            <hr
              className={
                `margin-y-105 ` +
                `border-width-1px border-x-width-0 border-bottom-width-0 border-solid border-base-light`
              }
            />

            <p className="margin-0">
              <label htmlFor="evModelYear">EV model year:</label>

              <EERESelectInput
                ariaLabel="TODO"
                options={evModelYearOptions}
                value={evModelYear}
                fieldName="evModelYear"
                onChange={(option) => dispatch(updateEereEVModelYear(option))}
              />

              <Tooltip id="evModelYear">
                <>TODO</>
              </Tooltip>
            </p>

            <p className="margin-0">
              <label htmlFor="iceReplacementVehicle">
                Internal combustion engine vehicle being replaced:
              </label>

              <EERESelectInput
                ariaLabel="TODO"
                options={iceReplacementVehicleOptions}
                value={iceReplacementVehicle}
                fieldName="iceReplacementVehicle"
                onChange={(option) =>
                  dispatch(updateEereICEReplacementVehicle(option))
                }
              />

              <Tooltip id="iceReplacementVehicle">
                <>TODO</>
              </Tooltip>
            </p>

            <EVSalesAndStockTable />

            <EEREEVComparisonTable />
          </section>
        </details>
      </div>

      <p className="margin-bottom-2 text-center">
        <a
          className={
            calculationDisabled
              ? 'avert-button avert-button-disabled'
              : 'avert-button'
          }
          href="/"
          onClick={(ev) => {
            ev.preventDefault();
            if (calculationDisabled) return;
            dispatch(calculateEereProfile());
          }}
          data-avert-calculate-impacts-btn
        >
          {eereButtonOptions[status]}
        </a>
      </p>
    </>
  );
}
