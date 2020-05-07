// reducers
import { AppThunk } from 'app/redux/index';
// engines
import { avert, eereProfile } from 'app/engines';

type RdfJSON = {
  region: any; // TODO
  run: any; // TODO
  limits: any; // TODO
  regional_load: any[]; // TODO
  load_bin_edges: number[];
  data: any;
};

type EereJSON = {
  region: string;
  data: any[];
};

type RdfsAction =
  | {
      type: 'rdfs/RECEIVE_REGION_RDF';
      payload: RdfJSON;
    }
  | {
      type: 'rdfs/RECEIVE_REGION_DEFAULTS';
      payload: EereJSON;
    };

type RdfsState = {
  defaults: EereJSON;
  rdf: RdfJSON;
};

// reducer
const initialState: RdfsState = {
  defaults: {
    region: '',
    data: [],
  },
  rdf: {
    region: null,
    run: null,
    limits: null,
    regional_load: [],
    load_bin_edges: [],
    data: null,
  },
};

export default function reducer(
  state: RdfsState = initialState,
  action: RdfsAction,
): RdfsState {
  switch (action.type) {
    case 'rdfs/RECEIVE_REGION_RDF':
      return {
        ...state,
        rdf: action.payload,
      };

    case 'rdfs/RECEIVE_REGION_DEFAULTS':
      return {
        ...state,
        defaults: action.payload,
      };

    default:
      return state;
  }
}

// action creators
export const fetchRegion = (): AppThunk => {
  return function (dispatch, getState) {
    const { api } = getState();

    dispatch({ type: 'rdfs/REQUEST_REGION_RDF' });

    // fetch rdf data for region
    return fetch(`${api.baseUrl}/api/v1/rdf/${avert.regionSlug}`)
      .then((response) => response.json())
      .then((json: RdfJSON) => {
        avert.rdf = json;

        // set eere profile's first level validation limits (sets 'eereProfile._limits')
        eereProfile.limits = {
          hours: avert.rdf.months.length,
          annualGwh: avert.rdf.maxAnnualGwh,
          renewables: avert.rdf.maxRenewableMwh,
          percent: avert.rdf.maxEEPercent,
        };

        dispatch({
          type: 'rdfs/RECEIVE_REGION_RDF',
          payload: json,
        });

        dispatch({
          type: 'rdfs/SET_EERE_LIMITS',
          payload: { limits: eereProfile.limits },
        });

        dispatch({ type: 'rdfs/REQUEST_REGION_DEFAULTS' });

        // fetch eere data for region
        fetch(`${api.baseUrl}/api/v1/eere/${avert.regionSlug}`)
          .then((response) => response.json())
          .then((json: EereJSON) => {
            avert.eereDefaults = json;

            dispatch({
              type: 'rdfs/RECEIVE_REGION_DEFAULTS',
              payload: json,
            });
          });
      });
  };
};
