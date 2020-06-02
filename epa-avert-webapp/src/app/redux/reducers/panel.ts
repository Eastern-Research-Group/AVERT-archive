type PanelAction =
  | {
      type: 'annualDisplacement/INCREMENT_PROGRESS';
    }
  | {
      type: 'panel/CHANGE_ACTIVE_STEP';
      payload: {
        stepNumber: number;
      };
    }
  | {
      type: 'panel/TOGGLE_MODAL_OVERLAY';
    }
  | {
      type: 'panel/STORE_ACTIVE_MODAL';
      payload: {
        activeModalId: number;
      };
    }
  | {
      type: 'panel/RESET_ACTIVE_MODAL';
      payload: {
        activeModalId: number;
      };
    }
  | {
      type: 'rdfs/REQUEST_REGION_RDF';
    }
  | {
      type: 'eere/SUBMIT_EERE_CALCULATION';
    }
  | {
      type: 'annualDisplacement/START_DISPLACEMENT';
    }
  | {
      type: 'rdfs/RECEIVE_REGION_DEFAULTS';
    }
  | {
      type: 'eere/COMPLETE_EERE_CALCULATION';
    }
  | {
      type: 'annualDisplacement/RECEIVE_DISPLACEMENT';
    }
  | {
      type: 'monthlyEmissions/COMPLETE_MONTHLY_EMISSIONS';
    };

type PanelState = {
  activeStep: number;
  loading: boolean;
  loadingProgress: number;
  modalOverlay: boolean;
  activeModalId: number;
  closingModalId: number;
};

// reducer
const initialState: PanelState = {
  activeStep: 1,
  loading: false,
  loadingProgress: 0,
  modalOverlay: false,
  activeModalId: 0,
  closingModalId: 0,
};

export default function reducer(
  state: PanelState = initialState,
  action: PanelAction,
): PanelState {
  switch (action.type) {
    case 'annualDisplacement/INCREMENT_PROGRESS':
      return {
        ...state,
        loadingProgress: ++state.loadingProgress,
      };

    case 'panel/CHANGE_ACTIVE_STEP':
      return {
        ...state,
        activeStep: action.payload.stepNumber,
      };

    case 'panel/TOGGLE_MODAL_OVERLAY':
      return {
        ...state,
        modalOverlay: !state.modalOverlay,
      };

    case 'panel/STORE_ACTIVE_MODAL':
      return {
        ...state,
        activeModalId: action.payload.activeModalId,
        closingModalId: 0,
      };

    case 'panel/RESET_ACTIVE_MODAL':
      return {
        ...state,
        activeModalId: 0,
        closingModalId: action.payload.activeModalId,
      };

    case 'rdfs/REQUEST_REGION_RDF':
    case 'eere/SUBMIT_EERE_CALCULATION':
    case 'annualDisplacement/START_DISPLACEMENT':
      return {
        ...state,
        loading: true,
        loadingProgress: 0,
      };

    case 'rdfs/RECEIVE_REGION_DEFAULTS':
    case 'eere/COMPLETE_EERE_CALCULATION':
    case 'annualDisplacement/RECEIVE_DISPLACEMENT':
    case 'monthlyEmissions/COMPLETE_MONTHLY_EMISSIONS':
      return {
        ...state,
        loading: false,
      };

    default:
      return state;
  }
}

// action creators
export function setActiveStep(stepNumber: number) {
  return {
    type: 'panel/CHANGE_ACTIVE_STEP',
    payload: {
      stepNumber,
    },
  };
}

export function toggleModalOverlay() {
  return {
    type: 'panel/TOGGLE_MODAL_OVERLAY',
  };
}

export function storeActiveModal(modalId: number) {
  return {
    type: 'panel/STORE_ACTIVE_MODAL',
    payload: {
      activeModalId: modalId,
    },
  };
}

export function resetActiveModal(modalId: number) {
  return {
    type: 'panel/RESET_ACTIVE_MODAL',
    payload: {
      activeModalId: modalId,
    },
  };
}
