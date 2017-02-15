import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { Anchor } from '../components/vanilla/button';
import { HeadingOne } from '../components/vanilla/heading';
import { ListDividedState } from '../components/vanilla/list';

import containerStyles from './container.css';
import styles from './landing.css';

class Landing extends Component {
  render() {
    return (
      <div>
        <div className={ containerStyles.lightStrip }>
          <div>
            <div className={ containerStyles.wrapper }>
              <HeadingOne>
              Auto-build and publish software for any Linux system or device.
              </HeadingOne>

              <div className={ styles.bannerList }>
                <div className={ styles.bannerItem }>
                  <img src="http://placehold.it/200" />
                  <p>Push to GitHub.</p>
                </div>
                <div className={ styles.bannerItem }>
                  <img src="http://placehold.it/200" />
                  <p>Built automatically.</p>
                </div>
                <div className={ styles.bannerItem }>
                  <img src="http://placehold.it/200" />
                  <p>Published for your users.</p>
                </div>
              </div>

              <div className={ styles.bannerButton }>
                <Anchor  href="/auth/authenticate">Set Up in Minutes</Anchor>
              </div>
            </div>
          </div>
        </div>

        <section className={styles.section}>
          <div className={ `${styles.row} ${containerStyles.wrapper}` }>
            <ListDividedState className={ styles.rowItem }>
              <li>Scale to millions of installs</li>
              <li>Available on all clouds and Linux OSes</li>
              <li>No need for build infrastructure</li>
            </ListDividedState>

            <ListDividedState className={ styles.rowItem }>
              <li>Automatic updates for everyone</li>
              <li>Roll back versions effortlessly</li>
              <li>FREE for open source projects</li>
            </ListDividedState>
          </div>
        </section>

        <div className={styles.container}>
          {/* TODO brand logos */}
          {/* TODO workflow */}

          <div>
            <p>Snaps are secure, sandboxed, containerised applications, packaged with their dependencies for predictable behavior. With the Snap Store, people can safely install apps from any vendor on mission-critical devices and PCs.</p>
            <Anchor href="http://snapcraft.io">More about snaps</Anchor>
          </div>

          {/* TODO testimonials */}
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
