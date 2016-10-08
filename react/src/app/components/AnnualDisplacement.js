// Deps
import React, { Component } from 'react';
import { connect } from 'react-redux';

// App
import { statusEnum } from '../utils/statusEnum';

// Styles
import '../../styles/AnnualDisplacement.css';

class AnnualDisplacement extends Component {
    render() {
        const statusIndicator = statusEnum[this.props.annual_status].lang;
        const { data } = this.props;
console.log('AnnualDisplacement Component','data',data);
        return(
            <div>
                <h4>Annual Displacement</h4>
                <span>{ statusIndicator }</span>
                
                <table className="annual-displacement-table">
                    <thead>
                    <tr>
                        <th>&nbsp;</th>
                        <th>Original</th>
                        <th>Post-EERE</th>
                        <th>Impacts</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>Generation:</td>
                        <td>{data.generation.original}</td>
                        <td>{data.generation.post}</td>
                        <td>{data.generation.impact}</td>
                    </tr>
                    <tr>
                        <td>SO<sub>2</sub>:</td>
                        <td>{data.totalEmissions.so2.original}</td>
                        <td>{data.totalEmissions.so2.post}</td>
                        <td>{data.totalEmissions.so2.impact}</td>
                    </tr>
                    <tr>
                        <td>NO<sub>x</sub>:</td>
                        <td>{data.totalEmissions.nox.original}</td>
                        <td>{data.totalEmissions.nox.post}</td>
                        <td>{data.totalEmissions.nox.impact}</td>
                    </tr>

                    <tr>
                        <td>CO<sub>2</sub>:</td>
                        <td>{data.totalEmissions.co2.original}</td>
                        <td>{data.totalEmissions.co2.post}</td>
                        <td>{data.totalEmissions.co2.impact}</td>
                    </tr>
                    <tr>
                        <td>SO<sub>2</sub>:</td>
                        <td>{data.emissionRates.so2.original}</td>
                        <td>{data.emissionRates.so2.post}</td>
                        <td>&nbsp;</td>
                    </tr>
                    <tr>
                        <td>NO<sub>x</sub>:</td>
                        <td>{data.emissionRates.nox.original}</td>
                        <td>{data.emissionRates.nox.post}</td>
                        <td>&nbsp;</td>
                    </tr>
                    <tr>
                        <td>CO<sub>2</sub>:</td>
                        <td>{data.emissionRates.co2.original}</td>
                        <td>{data.emissionRates.co2.post}</td>
                        <td>&nbsp;</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        annual_status: state.annualDisplacement.status,
        data: state.annualDisplacement.results
    }
}

export default connect(mapStateToProps)(AnnualDisplacement);