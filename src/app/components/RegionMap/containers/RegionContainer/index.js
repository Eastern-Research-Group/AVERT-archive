import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
// action creators
import { selectRegion } from '../../../../actions';

const Region = (props) => (
  <g className='avert-region'
    onClick={(e) => {
      props.onRegionClick(props.regionId);
    }}
    data-active={ props.name === props.selectedRegion ? true : false }
  >
    { props.children }
  </g>
);

Region.propTypes = {
  regionId: PropTypes.string.isRequired,
  onRegionClick: PropTypes.func.isRequired,
  children: PropTypes.node,
};

const mapStateToProps = (state) => ({
  selectedRegion: state.regions.region,
});

const mapDispatchToProps = (dispatch) => ({
  onRegionClick(regionId) {
    dispatch(selectRegion(regionId));
  },
});

const RegionContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Region);

export default RegionContainer;
