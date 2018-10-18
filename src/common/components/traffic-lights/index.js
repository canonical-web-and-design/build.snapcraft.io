import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';

import styles from './traffic-light.css';

export const SIGNALS = {
  DEFAULT: 0,
  ACTIVE: 1,
  DONE: 2
};

const stateStyles = [
  false, // there is no style modifier for the default state
  styles.active,
  styles.done
];

export class Signal extends Component {

  render() {
    const { state, message } = this.props;
    const signalStyle = stateStyles[state];

    return (
      <div className={ styles.box }>
        <div className={ classNames(styles.signal, signalStyle) } />
        <p>{ message }</p>
      </div>
    );
  }
}

Signal.propTypes = {
  state: PropTypes.number.isRequired,
  message: PropTypes.string
};

export default class TrafficLights extends Component {

  constructor(props) {
    super(props);

    this.state = {
      signals: [{
        message: 'Connect to GitHub'
      }, {
        message: 'Choose a repo'
      }, {
        message: 'Name and YAML'
      }]
    };
  }

  render() {
    const { signalState } = this.props;

    return (
      <div className={ styles.trafficlight }>
        {this.state.signals.map((signal, idx) => {

          signal.state = signalState[idx];

          return (
            <Signal key = { idx } {...signal} />
          );
        })}
      </div>
    );
  }
}

TrafficLights.propTypes = {
  signalState: PropTypes.arrayOf(
    PropTypes.oneOf([
      SIGNALS.DEFAULT,
      SIGNALS.ACTIVE,
      SIGNALS.DONE
    ])
  ).isRequired
};
