/** @jsx jsx */

import React from 'react';
import { jsx, css } from '@emotion/core';
import { useDispatch } from 'react-redux';
// reducers
import { useTypedSelector } from 'app/redux/index';
import { selectState } from 'app/redux/reducers/states';
// config
import { StateId, states } from 'app/config';

const selectStyles = css`
  margin: 1.5rem 25% 0;
  width: 50%;
`;

function StatesList() {
  const dispatch = useDispatch();

  const selectedStateId = useTypedSelector(({ states }) => states.stateId);

  return (
    <select
      css={selectStyles}
      value={selectedStateId}
      onChange={(ev) => dispatch(selectState(ev.target.value as StateId))}
    >
      <option value={''} disabled>
        Select State
      </option>

      {Object.keys(states).map((stateId) => {
        return (
          <React.Fragment key={stateId}>
            <option value={stateId}>{states[stateId as StateId].name}</option>
          </React.Fragment>
        );
      })}
    </select>
  );
}

export default StatesList;
