import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { Anchor } from '../components/vanilla/button';
import { HeadingOne } from '../components/vanilla/heading';
import { HeadingThree } from '../components/vanilla/heading';
import { HeadingSix } from '../components/vanilla/heading';
import { ListDividedState } from '../components/vanilla/list';

import Testimonial from '../components/testimonial';
import containerStyles from './container.css';
import styles from './landing.css';
import octocat from '../images/octocat.svg';

import * as images from '../images';

class Landing extends Component {
  render() {
    return (
      <div>
        <div className={ containerStyles.strip }>
          <div>
            <div className={ `${containerStyles.wrapper} ${styles.centeredText}` }>
              <HeadingOne align='center'>
                Auto-build and publish software<br />for any Linux system or device
              </HeadingOne>

              <ul className={ styles.banner }>
                <li className={ styles.bannerImage }>
                  <img src='https://assets.ubuntu.com/v1/dcae3c70-header-final-01.svg' />
                </li>

                <li className={ styles.bannerLabel }>
                  Push to GitHub
                </li>
                <li className={ styles.bannerLabel }>
                  Built automatically
                </li>
                <li className={ styles.bannerLabel }>
                  Published for your users
                </li>
              </ul>

              <div className={ styles.bannerButton }>
                <Anchor href="/auth/authenticate" icon={ octocat } flavour='embiggened' appearance='positive' >
                  Set up in minutes
                </Anchor>
              </div>
            </div>
          </div>
        </div>

        <section className={ `${styles.section} ${styles.sectionNoBorder} ${containerStyles.lightStrip}` }>
          <div className={ `${styles.row} ${containerStyles.wrapper}` }>
            <ListDividedState className={ styles.rowItemGrow }>
              <li>Scale to millions of installs</li>
              <li>Available on all clouds and Linux OSes</li>
              <li>No need for build infrastructure</li>
            </ListDividedState>

            <ListDividedState className={ styles.rowItemGrow }>
              <li>Automatic updates for everyone</li>
              <li>Roll back versions effortlessly</li>
              <li>FREE for open source projects</li>
            </ListDividedState>
          </div>
        </section>

        <section className={ styles.section }>
          <HeadingSix align='center'>
            Publish your software for
          </HeadingSix>
          <div className={ `${styles.row} ${containerStyles.wrapper}` }>
            <img className={ styles.brandLogo } src={images.archlinux} />
            <img className={ styles.brandLogo } src={images.debian} />
            <img className={ styles.brandLogo } src={images.gentoo} />
            <img className={ styles.brandLogo } src={images.fedora} />
            <img className={ styles.brandLogo } src={images.opensuse} />
            <img className={ styles.brandLogo } src={images.ubuntu} />
          </div>
        </section>

        <section className={styles.section}>

          <div className={ `${styles.row} ${containerStyles.wrapper}`  }>
            <img src='https://assets.ubuntu.com/v1/1037bac4-workflow.svg' width='100%' />
          </div>

          <div className={ styles.centeredButton }>
            <Anchor href="/auth/authenticate" icon={ octocat } flavour='embiggened'  appearance='positive'>
              Get started now
            </Anchor>
          </div>
        </section>

        <section className={ styles.section }>
          <div className={ `${styles.row} ${containerStyles.wrapper}` }>

            <div className={styles.rowItemTwoThirds}>
              <p className={styles.snaps}>With Snapcraft, it&rsquo;s easy to get your software published in the Snap Store. This store lets people safely install apps from any vendor on mission-critical devices and PCs. Snaps are secure, sandboxed, containerised applications, packaged with their dependencies for predictable behaviour.</p>
              <a href="https://snapcraft.io" className={ styles.external } >More about snaps</a>
            </div>

            <div className={styles.rowItemOneThird}>
              <img src='https://assets.ubuntu.com/v1/7af63a6d-workflow-icon04.svg' width='150' height='150'/></div>
          </div>
        </section>

        <section className={ styles.section }>
          <div className={ `${containerStyles.wrapper}` }>
            <HeadingThree align='center'>
              What people are saying about Snapcraft
            </HeadingThree>

            <div className={ `${styles.row} ${styles.sectionNoBorder}` }>

              <div className={ styles.rowItemOneThird }>
                <Testimonial citation='Frank Karlitschek, Founder' logo='https://assets.ubuntu.com/v1/99a0b969-Nextcloud_Logo.svg'>
                  Snaps provide an excellent way to distribute updates in a way that is both secure and does not risk breaking end user devices.
                </Testimonial>
              </div>

              <div className={ styles.rowItemOneThird }>
                <Testimonial citation='Mac Devine, VP &amp; CTO' logo='https://assets.ubuntu.com/v1/683950fd-logo-ibm.svg'>
                  Snaps allow developers to build and deploy applications in a format that’s easily portable and upgradeable across a number of IoT devices so that a cognitive relationship between the cloud and the edges of the network can be established.
                </Testimonial>
              </div>

              <div className={ styles.rowItemOneThird }>
                <Testimonial citation='Aaron Ogle, Developer' logo='https://assets.ubuntu.com/v1/1ad274f9-rocket-chat.svg'>
                  Getting Rocket.Chat snapped was as easy as defining a simple yaml file and adding into our CI. This is definitely one of the easiest distribution methods we have ever used.
                </Testimonial>
              </div>

            </div>
          </div>
        </section>

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
