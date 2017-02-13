import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';

import Header from '../components/header';
import Footer from '../components/footer';

import { fetchUser } from '../actions/user';

export class App extends Component {
  fetchData(props) {
    if (props.auth.authenticated && !props.user.user && !props.user.isFetching) {
      this.props.dispatch(fetchUser());
    }
  }

  componentDidMount() {
    this.fetchData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.fetchData(nextProps);
  }

  render() {
    return (
      <div>
        <Helmet
          htmlAttributes={{ 'lang': 'en' }}
          titleTemplate='build.snapcraft.io - %s'
          defaultTitle='build.snapcraft.io'
          meta={[
            { 'name': 'description', 'content': 'build.snapcraft.io' },
          ]}
        />
        <Header
          authenticated={this.props.auth.authenticated}
          user={this.props.user.user}
        />
        { this.props.children }
        <Footer />
      </div>
    );
  }
}

App.propTypes = {
  children: PropTypes.node,
  auth: PropTypes.object,
  user: PropTypes.object,
  dispatch: PropTypes.func
};

function mapStateToProps(state) {
  const {
    auth,
    user
  } = state;

  return {
    auth,
    user
  };
}

export default connect(mapStateToProps)(App);
