import { ReactNode } from 'react';

type Action =
  | {
      type: 'panel/CHANGE_ACTIVE_STEP';
      payload: { stepNumber: number };
    }
  | {
      type: 'panel/DISPLAY_MODAL_DIALOG';
      payload: { description: ReactNode };
    }
  | { type: 'panel/RESET_MODAL_DIALOG' }
  | { type: 'panel/TOGGLE_MODAL_OVERLAY' }
  | {
      type: 'panel/STORE_ACTIVE_MODAL';
      payload: { activeModalId: string };
    }
  | {
      type: 'panel/RESET_ACTIVE_MODAL';
      payload: { activeModalId: string };
    }
  | { type: 'geography/REQUEST_SELECTED_REGIONS_DATA' }
  | { type: 'geography/RECEIVE_SELECTED_REGIONS_DATA' }
  | { type: 'impacts/START_HOURLY_ENERGY_PROFILE_CALCULATIONS' }
  | { type: 'impacts/COMPLETE_HOURLY_ENERGY_PROFILE_CALCULATIONS' }
  | { type: 'results/FETCH_EMISSIONS_CHANGES_REQUEST' }
  | { type: 'results/FETCH_EMISSIONS_CHANGES_SUCCESS' };

type State = {
  activeStep: number;
  loading: boolean;
  modalDialog: {
    displayed: boolean;
    description: ReactNode;
  };
  modalOverlay: boolean;
  activeModalId: string;
  closingModalId: string;
};

const initialState: State = {
  activeStep: 1,
  loading: false,
  modalDialog: {
    displayed: false,
    description: null,
  },
  modalOverlay: false,
  activeModalId: '',
  closingModalId: '',
};

export default function reducer(
  state: State = initialState,
  action: Action,
): State {
  switch (action.type) {
    case 'panel/CHANGE_ACTIVE_STEP': {
      const { stepNumber } = action.payload;

      return {
        ...state,
        activeStep: stepNumber,
      };
    }

    case 'panel/DISPLAY_MODAL_DIALOG': {
      const { description } = action.payload;

      return {
        ...state,
        modalDialog: {
          displayed: true,
          description,
        },
      };
    }

    case 'panel/RESET_MODAL_DIALOG': {
      return {
        ...state,
        modalDialog: {
          displayed: false,
          description: null,
        },
      };
    }

    case 'panel/TOGGLE_MODAL_OVERLAY': {
      return {
        ...state,
        modalOverlay: !state.modalOverlay,
      };
    }

    case 'panel/STORE_ACTIVE_MODAL': {
      const { activeModalId } = action.payload;

      return {
        ...state,
        activeModalId,
        closingModalId: '',
      };
    }

    case 'panel/RESET_ACTIVE_MODAL': {
      const { activeModalId } = action.payload;

      return {
        ...state,
        activeModalId: '',
        closingModalId: activeModalId,
      };
    }

    case 'geography/REQUEST_SELECTED_REGIONS_DATA':
    case 'impacts/START_HOURLY_ENERGY_PROFILE_CALCULATIONS':
    case 'results/FETCH_EMISSIONS_CHANGES_REQUEST': {
      return {
        ...state,
        loading: true,
      };
    }

    case 'geography/RECEIVE_SELECTED_REGIONS_DATA':
    case 'impacts/COMPLETE_HOURLY_ENERGY_PROFILE_CALCULATIONS':
    case 'results/FETCH_EMISSIONS_CHANGES_SUCCESS': {
      return {
        ...state,
        loading: false,
      };
    }

    default: {
      return state;
    }
  }
}

export function setActiveStep(stepNumber: number) {
  return {
    type: 'panel/CHANGE_ACTIVE_STEP',
    payload: { stepNumber },
  };
}

export function displayModalDialog(description: ReactNode) {
  return {
    type: 'panel/DISPLAY_MODAL_DIALOG',
    payload: { description },
  };
}

export function resetModalDialog() {
  return { type: 'panel/RESET_MODAL_DIALOG' };
}

export function toggleModalOverlay() {
  return { type: 'panel/TOGGLE_MODAL_OVERLAY' };
}

export function storeActiveModal(modalId: string) {
  return {
    type: 'panel/STORE_ACTIVE_MODAL',
    payload: { activeModalId: modalId },
  };
}

export function resetActiveModal(modalId: string) {
  return {
    type: 'panel/RESET_ACTIVE_MODAL',
    payload: { activeModalId: modalId },
  };
}
