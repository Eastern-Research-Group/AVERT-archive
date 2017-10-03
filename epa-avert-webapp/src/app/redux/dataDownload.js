import json2csv from 'json2csv';
import Blob from 'blob';
import FileSaver from 'file-saver';

// actions
const START_DATA_DOWNLOAD = 'avert/dataDownload/START_DATA_DOWNLOAD';

// reducer
const initialState = {
  file: false,
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case START_DATA_DOWNLOAD:
      return {
        ...state,
        file: true
      };

    default:
      return state;
  }
};

// action creators
export const startDataDownload = () => {
  return (dispatch, getState) => {
    const { monthlyEmissions } = getState();

    const fields = [
      'type',
      'aggregation_level',
      'state',
      'county',
      'emission_unit',
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december',
    ];

    const data = monthlyEmissions.newDownloadableData;

    try {
      const csv = json2csv({ fields, data });
      const blob = new Blob([csv], { type: 'text/plain:charset=utf-8' });
      FileSaver.saveAs(blob, 'AVERT Monthly Emissions.csv');
    } catch (e) {
      console.error(e);
    }

    // dispatch 'start data download' action
    return dispatch({ type: START_DATA_DOWNLOAD });
  }
};
