import PropTypes from 'prop-types';
import { Component } from 'react';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';

class EnsureSameUser extends Component {
  componentDidMount() {
    const { isSameUser } = this.props;

    if (!isSameUser) {
      browserHistory.replace('/');
    }
  }

  render() {
    const { isSameUser } = this.props;

    if (isSameUser) {
      return this.props.children;
    } else {
      return null;
    }
  }
}

EnsureSameUser.propTypes = {
  children: PropTypes.node,
  isSameUser: PropTypes.bool
};

function mapStateToProps(state, ownProps) {
  const { user } = state;
  const { owner } = ownProps.params;

  return {
    isSameUser: (user && user.login) === owner
  };
}

export default connect(mapStateToProps)(EnsureSameUser);
