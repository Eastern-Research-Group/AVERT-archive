// @flow

import React from 'react';
// components
import StepProgressBar from 'app/components/StepProgressBar';
import StepPanels from 'app/components/StepPanels/container.js';
// styles
import './styles.css';

type Props = {
  activeStep: number,
};

const App = (props: Props) => (
  <div className="avert-container avert-copy">
    <StepProgressBar activeTab={props.activeStep} />
    <StepPanels activePanel={props.activeStep} />
  </div>
);

export default App;
