import React, { Component } from 'react';
import Helmet from 'react-helmet';

import SelectRepositoriesPage from '../components/select-repositories-page';
import TrafficLights, { SIGNALS } from '../components/traffic-lights';
import styles from './container.css';

class SelectRepositories extends Component {
  render() {
    return (
      <div className={ styles.container }>
        <Helmet
          title='Select Repositories'
        />
        <TrafficLights signalState={[
          SIGNALS.DONE,
          SIGNALS.ACTIVE,
          SIGNALS.DEFAULT ]}
        />
        <SelectRepositoriesPage />
      </div>
    );
  }
}

export default SelectRepositories;
