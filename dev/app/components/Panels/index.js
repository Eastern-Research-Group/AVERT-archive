import React, { PropTypes } from 'react';
// components
import Panel from '../Panel';
import PanelBody from '../PanelBody';
import SelectItem from '../SelectItem';
import RegionMap from '../RegionMap';
import DetailsList from '../DetailsList';
// containers
import SelectListContainer from '../../containers/SelectListContainer';
import PanelFooterContainer from '../../containers/PanelFooterContainer';
// styles
import './styles.css';

const Panels = (props) => (
  <div className='avert-steps'>
    <Panel active={ props.activePanel === 1 ? true : false }>
      <PanelBody heading='Select Region'>
        <p>The contiguous 48 states are split into 10 AVERT regions, which are aggregates of EPA’s <a href='https://www.epa.gov/energy/egrid'>eGRID subregions</a>. Select a region for analysis by either using the dropdown menu or clicking the map. Selecting a region loads region-specific wind and solar capacity data and the power plants operating within each region.</p>

        <SelectListContainer>
          <SelectItem text='California' />
          <SelectItem text='Great Lakes / Mid-Atlantic' />
          <SelectItem text='Lower Midwest' />
          <SelectItem text='Northeast' />
          <SelectItem text='Northwest' />
          <SelectItem text='Rocky Mountains' />
          <SelectItem text='Southeast' />
          <SelectItem text='Southwest' />
          <SelectItem text='Texas' />
          <SelectItem text='Upper Midwest' />
        </SelectListContainer>

        <RegionMap />

        <p className="avert-small-text">The online version of AVERT can run analyses for 2015 only. The Excel version of AVERT (available for download <a href="https://www.epa.gov/statelocalclimate/download-avert">here</a>) allows analyses for years 2007–2015 or for a future year scenario.</p>
      </PanelBody>

      <PanelFooterContainer nextButtonText='Set EE/RE Impacts' />
    </Panel>



    <Panel active={ props.activePanel === 2 ? true : false }>
      <PanelBody heading='Set Energy Efficiency and Renewable Energy Impacts'>
        <p>AVERT quantifies avoided emissions and electricity generation displaced by EE/RE policies and programs. Specify the impacts of EE/RE programs below, and AVERT will use these inputs to generate results. For more information about inputs, please consult the <a href='https://www.epa.gov/statelocalclimate/avert-user-manual-0'>AVERT user manual</a>.</p>

        <p className="avert-small-text">Five types of programs are listed below (A through E). You can enter impacts for any or all types of programs, in any combination. AVERT will calculate cumulative impacts.</p>

        <DetailsList />
      </PanelBody>

      <PanelFooterContainer prevButtonText='Back to Region' nextButtonText='Get Results' />
    </Panel>



    <Panel active={ props.activePanel === 3 ? true : false }>
      <PanelBody heading='Results: Avoided Regional, State, and County-Level Emissions'>
        <h3 className='avert-heading-three'>Annual Regional Displacements</h3>
      </PanelBody>

      <PanelFooterContainer prevButtonText='Back to EE/RE Impacts' nextButtonText='Reset Region' lastPanel />
    </Panel>
  </div>
);

Panels.propTypes = {
  activePanel: PropTypes.number.isRequired,
};

export default Panels;
