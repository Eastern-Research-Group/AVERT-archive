import React from 'react';
import { useDispatch } from 'react-redux';
// reducers
import { usePanelState, setActiveStep } from 'app/redux/panel';
import { useRegionState } from 'app/redux/region';
import { useEereState, resetEereInputs } from 'app/redux/eere';
import { fetchRegion } from 'app/redux/rdfs';
import { calculateDisplacement } from 'app/redux/annualDisplacement';
import { resetMonthlyEmissions } from 'app/redux/monthlyEmissions';
// styles
import './styles.css';

type Props = {
  prevButtonText?: string;
  nextButtonText: string;
};

function PanelFooter({ prevButtonText, nextButtonText }: Props) {
  const dispatch = useDispatch();
  const activeStep = usePanelState((state) => state.activeStep);
  const regionId = useRegionState((state) => state.id);
  const eereStatus = useEereState((state) => state.status);
  const hardValid = useEereState((state) => state.hardLimit.valid);

  const onStepOne = activeStep === 1;
  const onStepTwo = activeStep === 2;
  const onStepThree = activeStep === 3;

  // smooth scroll to top
  function scrollToTop(duration = 300) {
    // const step = -window.scrollY / (duration / 16.666);
    // const interval = setInterval(() => {
    //   if (window.scrollY === 0) { clearInterval(interval) }
    //   window.scrollBy(0, step);
    // }, 16.666);
    window.scrollTo(0, 0);
  }

  const prevButton = !prevButtonText ? null : (
    <a
      className="avert-button avert-prev"
      href="/"
      onClick={(ev) => {
        ev.preventDefault();
        scrollToTop();
        // prevButtonText isn't provided to first step's use of PanelFooter,
        // so we can safely always assume we're on step 2 or 3
        dispatch(resetEereInputs());
        dispatch(setActiveStep(activeStep - 1));
      }}
    >
      {prevButtonText}
    </a>
  );

  // conditionally define reset and disabled classes
  const noRegionSelected = onStepOne && regionId === 0;
  const calculationRunning = onStepTwo && eereStatus !== 'complete';
  const exceedsHardValidationLimit = onStepTwo && !hardValid;

  const disabledClass =
    noRegionSelected || calculationRunning || exceedsHardValidationLimit
      ? 'avert-button-disabled'
      : '';

  const resetClass = onStepThree ? 'avert-reset-button' : '';

  const nextButton = (
    <a
      className={`avert-button avert-next ${disabledClass} ${resetClass}`}
      href="/"
      onClick={(ev) => {
        ev.preventDefault();

        if (noRegionSelected) return;

        if (onStepOne) {
          scrollToTop();
          dispatch(fetchRegion());
        }

        if (onStepTwo) {
          if (eereStatus === 'complete' && hardValid) {
            scrollToTop();
            dispatch(calculateDisplacement());
          } else {
            return;
          }
        }

        if (onStepThree) {
          scrollToTop();
          dispatch(resetEereInputs());
          dispatch(resetMonthlyEmissions());
        }

        dispatch(setActiveStep(onStepThree ? 1 : activeStep + 1));
      }}
    >
      {nextButtonText}
    </a>
  );

  return (
    <div className="avert-step-footer">
      <p className="avert-centered">
        {prevButton}
        {nextButton}
      </p>
    </div>
  );
}

export default PanelFooter;
