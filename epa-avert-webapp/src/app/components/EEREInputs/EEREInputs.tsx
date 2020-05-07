import React from 'react';
import { useDispatch } from 'react-redux';
// components
import EEREInputField from 'app/components/EEREInputField';
import Tooltip from 'app/components/Tooltip/Tooltip';
// reducers
import {
  InputFields,
  useEereState,
  updateEereAnnualGwh,
  updateEereConstantMw,
  updateEereBroadBasedProgram,
  updateEereReduction,
  updateEereTopHours,
  updateEereWindCapacity,
  updateEereUtilitySolar,
  updateEereRooftopSolar,
  calculateEereProfile,
} from 'app/redux/reducers/eere';
// styles
import './styles.css';

function EEREInputs() {
  const dispatch = useDispatch();
  const status = useEereState(({ status }) => status);
  const valid = useEereState(({ valid }) => valid);
  const errors = useEereState(({ errors }) => errors);
  const limits = useEereState(({ limits }) => limits);
  const constantMwh = useEereState(({ inputs }) => inputs?.constantMwh);
  const annualGwh = useEereState(({ inputs }) => inputs?.annualGwh);
  const broadProgram = useEereState(({ inputs }) => inputs?.broadProgram);
  const reduction = useEereState(({ inputs }) => inputs?.reduction);
  const topHours = useEereState(({ inputs }) => inputs?.topHours);
  const windCapacity = useEereState(({ inputs }) => inputs?.windCapacity);
  const utilitySolar = useEereState(({ inputs }) => inputs?.utilitySolar);
  const rooftopSolar = useEereState(({ inputs }) => inputs?.rooftopSolar);

  function displayError({
    fieldName,
    inputValue,
    maxValue,
  }: {
    fieldName: InputFields;
    inputValue: string;
    maxValue: number;
  }) {
    if (inputValue?.length <= 0) return;
    if (!errors?.includes(fieldName)) return;

    return Number(inputValue) >= 0 ? (
      <span className="avert-input-error">
        <span className="avert-input-error-range">
          Please enter a number between 0 and {maxValue}.
        </span>
        This will help ensure that each of your proposed programs displaces no
        more than approximately 30% of regional fossil generation in any given
        hour. After you enter all your inputs and calculate your hourly EE/RE
        profile below, AVERT will check more precisely to ensure that your
        combined inputs are within AVERT’s recommended limits.
      </span>
    ) : (
      <span className="avert-input-error">
        <span className="avert-input-error-range">
          Please enter a positive number.
        </span>
        If you wish to model a reverse EE/RE scenario (i.e., a negative number),
        use the Excel version of the AVERT Main Module.
      </span>
    );
  }

  // text input values from fields
  const inputsFields = [
    constantMwh,
    annualGwh,
    broadProgram,
    reduction,
    topHours,
    windCapacity,
    utilitySolar,
    rooftopSolar,
  ];

  const inputsAreEmpty =
    inputsFields.filter((field) => field?.length > 0).length === 0;

  const disabledClass =
    !valid || inputsAreEmpty || status === 'started'
      ? ' avert-button-disabled'
      : '';

  const eereButtonOptions = {
    ready: 'Calculate EE/RE Impacts',
    started: 'Calculating...',
    complete: 'Recalculate EE/RE Impacts',
  };

  return (
    <div>
      <div className="avert-details-block">
        <header>
          <p>Energy Efficiency</p>
        </header>

        <details>
          <summary data-label="A">
            Reductions spread evenly throughout the year
          </summary>
          <section>
            <p>
              <strong>Choose one:</strong>
            </p>
            <ul>
              <li>
                <span className="avert-input-label">
                  Reduce total annual generation by{' '}
                </span>
                <EEREInputField
                  value={annualGwh}
                  disabled={constantMwh}
                  onChange={dispatch(updateEereAnnualGwh)}
                />
                <span className="avert-input-unit"> GWh </span>

                <Tooltip id={1}>
                  Enter the total number of GWh expected to be saved in a single
                  year. This option simply distributes the total annual savings
                  evenly over all hours of the year. An industrial or
                  refrigeration efficiency program may be well represented by a
                  constant reduction across most hours of the year.
                </Tooltip>

                {displayError({
                  fieldName: 'annualGwh',
                  inputValue: annualGwh,
                  maxValue: limits?.annualGwh,
                })}
              </li>

              <li>
                <span className="avert-input-label">
                  Reduce hourly generation by{' '}
                </span>
                <EEREInputField
                  value={constantMwh}
                  disabled={annualGwh}
                  onChange={dispatch(updateEereConstantMw)}
                />
                <span className="avert-input-unit"> MW </span>

                <Tooltip id={2}>
                  “Reduce hourly generation” is identical in effect to reducing
                  total annual generation. It allows you to enter a constant
                  reduction for every hour of the year, in MW. An industrial or
                  refrigeration efficiency program may be well represented by a
                  constant reduction across most hours of the year.
                </Tooltip>

                {displayError({
                  fieldName: 'constantMwh',
                  inputValue: constantMwh,
                  maxValue: limits?.constantMwh,
                })}
              </li>
            </ul>
          </section>
        </details>

        <details>
          <summary data-label="B">
            Percentage reductions in some or all hours
          </summary>
          <section>
            <p>
              <strong>Choose one:</strong>
            </p>
            <ul>
              <li>
                <span className="avert-input-label">
                  Broad-based program: Reduce generation by{' '}
                </span>
                <EEREInputField
                  value={broadProgram}
                  disabled={reduction || topHours}
                  onChange={dispatch(updateEereBroadBasedProgram)}
                />
                <span className="avert-input-unit"> % in all hours </span>

                <Tooltip id={3}>
                  To simulate a broad-based efficiency program, enter an
                  estimated load reduction fraction. This percentage reduction
                  will be applied to all hours of the year.
                </Tooltip>

                {displayError({
                  fieldName: 'reduction',
                  inputValue: broadProgram,
                  maxValue: limits?.percent,
                })}
              </li>

              <li>
                <span className="avert-input-label">
                  Targeted program: Reduce generation by{' '}
                </span>
                <EEREInputField
                  value={reduction}
                  disabled={broadProgram}
                  onChange={dispatch(updateEereReduction)}
                />
                <span className="avert-input-unit"> % during the peak </span>
                <EEREInputField
                  value={topHours}
                  disabled={broadProgram}
                  onChange={dispatch(updateEereTopHours)}
                />
                <span className="avert-input-unit"> % of hours </span>

                <Tooltip id={4}>
                  To simulate a peak-reduction targeting program such as demand
                  response, enter the load reduction (as a fraction of peaking
                  load) that would be targeted, as well as the fraction of
                  high-demand hours that the program is expected to affect
                  (e.g., 1%–3%).
                </Tooltip>

                {displayError({
                  fieldName: 'reduction',
                  inputValue: reduction,
                  maxValue: limits?.percent,
                })}

                {displayError({
                  fieldName: 'topHours',
                  inputValue: topHours,
                  maxValue: 100,
                })}
              </li>
            </ul>
          </section>
        </details>

        <header>
          <p>Renewable Energy</p>
        </header>

        <details>
          <summary data-label="C">Wind</summary>
          <section>
            <p>
              <span className="avert-input-label">Total capacity: </span>
              <EEREInputField
                value={windCapacity}
                onChange={dispatch(updateEereWindCapacity)}
              />
              <span className="avert-input-unit"> MW </span>

              <Tooltip id={5}>
                Enter the total capacity (maximum potential electricity
                generation) for this type of resource, measured in MW. The model
                uses these inputs along with hourly capacity factors that vary
                by resource type and region.
              </Tooltip>

              {displayError({
                fieldName: 'windCapacity',
                inputValue: windCapacity,
                maxValue: limits?.renewables,
              })}
            </p>
          </section>
        </details>

        <details>
          <summary data-label="D">Utility-scale solar photovoltaic</summary>
          <section>
            <p>
              <span className="avert-input-label">Total capacity: </span>
              <EEREInputField
                value={utilitySolar}
                onChange={dispatch(updateEereUtilitySolar)}
              />
              <span className="avert-input-unit"> MW </span>

              <Tooltip id={6}>
                Enter the total capacity (maximum potential electricity
                generation) for this type of resource, measured in MW. The model
                uses these inputs along with hourly capacity factors that vary
                by resource type and region.
              </Tooltip>

              {displayError({
                fieldName: 'utilitySolar',
                inputValue: utilitySolar,
                maxValue: limits?.renewables,
              })}
            </p>
          </section>
        </details>

        <details>
          <summary data-label="E">
            Distributed (rooftop) solar photovoltaic
          </summary>
          <section>
            <p>
              <span className="avert-input-label">Total capacity: </span>
              <EEREInputField
                value={rooftopSolar}
                onChange={dispatch(updateEereRooftopSolar)}
              />
              <span className="avert-input-unit"> MW </span>

              <Tooltip id={7}>
                Enter the total capacity (maximum potential electricity
                generation) for this type of resource, measured in MW. The model
                uses these inputs along with hourly capacity factors that vary
                by resource type and region.
              </Tooltip>

              {displayError({
                fieldName: 'rooftopSolar',
                inputValue: rooftopSolar,
                maxValue: limits?.renewables,
              })}
            </p>
          </section>
        </details>
      </div>

      <p className="avert-impacts-button">
        <a
          className={`avert-button${disabledClass}`}
          href="/"
          onClick={(ev) => {
            ev.preventDefault();
            // if valid prop (state) is true, calculate profile
            valid && dispatch(calculateEereProfile());
          }}
        >
          {eereButtonOptions[status]}
        </a>
      </p>
    </div>
  );
}

export default EEREInputs;
