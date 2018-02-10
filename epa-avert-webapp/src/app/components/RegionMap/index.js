// @flow

import React from 'react';
// enums
import Regions from 'app/enums/Regions';
// components
import Region from './components/Region/container.js';
import UpperMidwest from './components/UpperMidwest';
import Texas from './components/Texas';
import Southwest from './components/Southwest';
import Southeast from './components/Southeast';
import RockyMountains from './components/RockyMountains';
import Northwest from './components/Northwest';
import Northeast from './components/Northeast';
import LowerMidwest from './components/LowerMidwest';
import GreatLakes from './components/GreatLakes';
import California from './components/California';
// styles
import './styles.css';

const RegionMap = () => (
  <div className='avert-region-map'>
    <svg xmlns='http://www.w3.org/2000/svg' width='720' height='500' viewBox='0 0 720 500'>
      <title>AVERT region map</title>

      <g id='avert-regions'>
        <Region regionId={Regions.UPPER_MIDWEST.id}>
          <UpperMidwest />
        </Region>

        <Region regionId={Regions.TEXAS.id}>
          <Texas />
        </Region>

        <Region regionId={Regions.SOUTHWEST.id}>
          <Southwest />
        </Region>

        <Region regionId={Regions.SOUTHEAST.id}>
          <Southeast />
        </Region>

        <Region regionId={Regions.ROCKY_MOUNTAINS.id}>
          <RockyMountains />
        </Region>

        <Region regionId={Regions.NORTHWEST.id}>
          <Northwest />
        </Region>

        <Region regionId={Regions.NORTHEAST.id}>
          <Northeast />
        </Region>

        <Region regionId={Regions.LOWER_MIDWEST.id}>
          <LowerMidwest />
        </Region>

        <Region regionId={Regions.GREAT_LAKES_MID_ATLANTIC.id}>
          <GreatLakes />
        </Region>

        <Region regionId={Regions.CALIFORNIA.id}>
          <California />
        </Region>
      </g>

      <g id='avert-labels'>
        <g className='label'>
          <rect x='10' y='223' width='85' height='22'/>
          <text transform='translate(15 240)'>
            {Regions.CALIFORNIA.label}
          </text>
        </g>
        <g className='label'>
          <rect x='465' y='183' width='206' height='22'/>
          <text transform='translate(470 200)'>
            {Regions.GREAT_LAKES_MID_ATLANTIC.label}
          </text>
        </g>
        <g className='label'>
          <rect x='275' y='283' width='125' height='22'/>
          <text transform='translate(280 300)'>
            {Regions.LOWER_MIDWEST.label}
          </text>
        </g>
        <g className='label'>
          <rect x='595' y='113' width='86' height='22'/>
          <text transform='translate(600 130)'>
            {Regions.NORTHEAST.label}
          </text>
        </g>
        <g className='label'>
          <rect x='95' y='133' width='88' height='22'/>
          <text transform='translate(100 150)'>
            {Regions.NORTHWEST.label}
          </text>
        </g>
        <g className='label'>
          <rect x='175' y='213' width='142' height='22'/>
          <text transform='translate(180 230)'>
            {Regions.ROCKY_MOUNTAINS.label}
          </text>
        </g>
        <g className='label'>
          <rect x='465' y='323' width='88' height='22'/>
          <text transform='translate(470 340)'>
            {Regions.SOUTHEAST.label}
          </text>
        </g>
        <g className='label'>
          <rect x='135' y='313' width='92' height='22'/>
          <text transform='translate(140 330)'>
            {Regions.SOUTHWEST.label}
          </text>
        </g>
        <g className='label'>
          <rect x='295' y='383' width='56' height='22'/>
          <text transform='translate(300 400)'>
            {Regions.TEXAS.label}
          </text>
        </g>
        <g className='label'>
          <rect x='305' y='143' width='125' height='22'/>
          <text transform='translate(310 160)'>
            {Regions.UPPER_MIDWEST.label}
          </text>
        </g>
      </g>
    </svg>
  </div>
);

export default RegionMap;
