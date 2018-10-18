import React, { Component } from 'react';
import Helmet from 'react-helmet';

import BetaNotification from '../components/beta-notification';
import SelectRepositoriesPage from '../components/select-repositories-page';
import UserAvatar from '../components/user-avatar';
import styles from './container.css';

class SelectRepositories extends Component {
  render() {
    return (
      <div className={ styles.container }>
        <Helmet>
          <title>Select Repositories</title>
        </Helmet>
        <BetaNotification />
        <UserAvatar />
        <SelectRepositoriesPage />
      </div>
    );
  }
}

export default SelectRepositories;
