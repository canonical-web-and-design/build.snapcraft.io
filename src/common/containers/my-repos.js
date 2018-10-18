import React, { Component } from 'react';
import Helmet from 'react-helmet';

import BetaNotification from '../components/beta-notification';
import RepositoriesHome from '../components/repositories-home';
import UserAvatar from '../components/user-avatar';
import styles from './container.css';

class MyRepos extends Component {
  render() {
    return (
      <div className={ styles.container }>
        <Helmet>
          <title>Home</title>
        </Helmet>
        <BetaNotification />
        <UserAvatar />
        <RepositoriesHome />
      </div>
    );
  }
}

export default MyRepos;
