import React, { Component } from 'react';
import Helmet from 'react-helmet';

import RepositoryInput from '../components/repository-input';
import styles from './container.css';

class Home extends Component {
  render() {
    return (
      <div className={ styles.container }>
        <Helmet
          title='Home'
        />
        <RepositoryInput />
      </div>
    );
  }
}

export default Home;
