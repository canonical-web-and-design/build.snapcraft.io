import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';

import Header from '../components/header';
import Footer from '../components/footer';
import CookieNotification from '../components/cookie-notification';
import Notification from '../components/vanilla-modules/notification';

import styles from './container.css';

export class App extends Component {
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
          user={this.props.user}
          dispatch={this.props.dispatch}
        />
        {/* XXX: to be removed when maintenance is over */}
        <div className={ styles.container }>
          <Notification appearance='negative'>
            Due to maintenance on the build farm over the past couple of days there is a possible delay in your builds being processed.<br/>
            Apologies for the inconvenience and please bear with us while we work through the backlog.
          </Notification>
        </div>
        {/* XXX */}
        { this.props.children }
        <Footer />
        <CookieNotification />
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
