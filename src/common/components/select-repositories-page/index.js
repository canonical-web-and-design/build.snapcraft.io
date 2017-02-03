import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { fetchUserRepositories } from '../../actions/repositories';
import SelectRepositoryList from '../select-repository-list';

class SelectRepositoriesPage extends Component {
  componentDidMount() {
    const { authenticated } = this.props.auth;

    if (authenticated) {
      this.props.dispatch(fetchUserRepositories());
    }
  }

  render() {
    return (
      <div>
        <h2>You’ve successfully imported all your repos from GitHub!</h2>
        <SelectRepositoryList />
      </div>
    );
  }
}

SelectRepositoriesPage.propTypes = {
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

export default connect(mapStateToProps)(SelectRepositoriesPage);
