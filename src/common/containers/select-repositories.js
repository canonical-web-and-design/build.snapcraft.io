import React, { Component } from 'react';
import Helmet from 'react-helmet';

import SelectRepositoriesPage from '../components/select-repositories-page';
import styles from './container.css';

class SelectRepositories extends Component {
  render() {
    return (
      <div className={ styles.container }>
        <Helmet
          title='Select Repositories'
        />
        <SelectRepositoriesPage />
      </div>
    );
  }
}

export default SelectRepositories;
