import stateEmissionsReducer, {
  COMPLETE_STATE_EMISSIONS,
} from 'app/redux/stateEmissions';

describe('stateEmissionsReducer', () => {
  it('should return an initial state', () => {
    expect(stateEmissionsReducer(undefined, {}))
    .toEqual({
      status: 'select_region',
      results: {
        states: [],
        data: [],
      },
    });
  });

  it('should handle COMPLETE_STATE_EMISSIONS', () => {
    expect(stateEmissionsReducer(undefined, {
      type: COMPLETE_STATE_EMISSIONS,
      data: {
        states: ['Foo'],
        data: ['Bar'],
      },
    }))
    .toEqual({
      status: 'complete',
      results: {
        states: ['Foo'],
        data: ['Bar'],
      },
    })
  });
});
