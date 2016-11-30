import React, { Component } from 'react';
import Helmet from 'react-helmet';

import HelloWorld from '../components/hello-world';
import RepositoryInput from '../components/repository-input';

import styles from './container.css';

export default class Home extends Component {

  render() {
    return (
      <div className={ styles.container }>
        <Helmet
          title='Home'
        />
        <HelloWorld />
        <RepositoryInput />
      </div>
    );
  }
}
