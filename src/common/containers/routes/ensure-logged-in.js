import { PropTypes, Component } from 'react';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';

class EnsureLoggedIn extends Component {
  componentDidMount() {
    const { isLoggedIn } = this.props;

    if (!isLoggedIn) {
      browserHistory.replace('/');
    }
  }

  render() {
    const { isLoggedIn } = this.props;

    if (isLoggedIn) {
      return this.props.children;
    } else {
      return null;
    }
  }
}

EnsureLoggedIn.propTypes = {
  children: PropTypes.node,
  isLoggedIn: PropTypes.bool
};

function mapStateToProps(state) {
  return {
    isLoggedIn: state.auth.authenticated
  };
}

export default connect(mapStateToProps)(EnsureLoggedIn);
