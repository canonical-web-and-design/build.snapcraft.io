import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { fetchUserRepositories } from '../../actions/repositories';
import SelectRepositoryList from '../select-repository-list';
import { HeadingThree } from '../vanilla/heading';
import { CardHighlighted } from '../vanilla/card';

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
        <CardHighlighted>
          <HeadingThree>
            Select your repositories
          </HeadingThree>
          <SelectRepositoryList />
        </CardHighlighted>
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
