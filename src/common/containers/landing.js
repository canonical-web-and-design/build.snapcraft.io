import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { Anchor } from '../components/vanilla/button';
import { HeadingOne } from '../components/vanilla/heading';

import styles from './container.css';

import 'isomorphic-fetch';

class Landing extends Component {
  render() {
    return (
      <div>
        <div className={ styles.lightStrip }>
          <div>
            <div className={ styles.wrapper }>
              <HeadingOne>
              Auto-build and publish software for any Linux system or device.
              </HeadingOne>

              <div>
                {/* TODO image placeholders */}
                <h3>Push to GitHub. • Built automatically. • Published for your users.</h3>
              </div>

              <Anchor href="/auth/authenticate">Set Up in Minutes</Anchor>
            </div>
          </div>
        </div>
        <div className={ styles.container }>

          {/* TODO brand logos */}

          {/* TODO workflow */}

          <div>
            {/* TODO 2 columns */}
            <ul>
              <li>Scale to millions of installs</li>
              <li>Available on all clouds and Linux OSes</li>
              <li>No need for build infrastructure</li>
              <li>Automatic updates for everyone</li>
              <li>Roll back versions effortlessly</li>
              <li>FREE for open source projects</li>
            </ul>
          </div>

          <div>
            <p>Snaps are secure, sandboxed, containerised applications, packaged with their dependencies for predictable behavior. With the Snap Store, people can safely install apps from any vendor on mission-critical devices and PCs.</p>
            <Anchor href="http://snapcraft.io">More about snaps</Anchor>
            {/* TODO testimonials */}
          </div>
        </div>
      </div>
    );
  }

}

Landing.propTypes = {
  children: PropTypes.node,
  auth: PropTypes.object
};

function mapStateToProps(state) {
  const {
    auth
  } = state;

  return {
    auth
  };
}

export default connect(mapStateToProps)(Landing);
