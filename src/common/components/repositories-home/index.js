import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { fetchUserSnaps } from '../../actions/snaps';
import { Anchor } from '../vanilla/button';
import RepositoriesList from '../repositories-list';
import styles from './repositories-home.css';

class RepositoriesHome extends Component {
  componentDidMount() {
    const { authenticated } = this.props.auth;

    if (authenticated) {
      this.props.dispatch(fetchUserSnaps());
    }
  }

  render() {
    return (
      <div>
        <h2>Repos to build and publish</h2>
        <div className={ styles['button-container'] }>
          <Anchor appearance="neutral" href="dashboard/select-repositories/">
            Add new repository
          </Anchor>
        </div>
        <RepositoriesList />
      </div>
    );
  }
}

RepositoriesHome.propTypes = {
  auth: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const {
    auth
  } = state;

  return {
    auth
  };
}

export default connect(mapStateToProps)(RepositoriesHome);
