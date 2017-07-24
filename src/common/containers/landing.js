import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { Anchor } from '../components/vanilla-modules/button';
import { HeadingTwo, HeadingThree } from '../components/vanilla-modules/heading';
import { ListWithIcon } from '../components/vanilla/list';

import Testimonial from '../components/testimonial';
import containerStyles from './container.css';
import styles from './landing.css';
import octocat from '../images/octocat.svg';

import * as images from '../images';

class Landing extends Component {
  render() {
    const { user } = this.props;
    return (
      <div>
        <div className={ containerStyles.strip }>
          <div>
            <div className={ `${containerStyles.wrapper} ${styles.centeredText}` }>
              <HeadingTwo>
                Auto-build and publish software<br />for any Linux system or device
              </HeadingTwo>

              <ul className={ styles.banner }>
                <li className={ styles.bannerImage }>
                  <img src='https://assets.ubuntu.com/v1/ed6d1c5b-build.snapcraft.hero.svg' alt=""/>
                </li>

                <li className={ styles.bannerLabel }>
                  Push to GitHub
                </li>
                <li className={ styles.bannerLabel }>
                  Built automatically
                </li>
                <li className={ styles.bannerLabel }>
                  Released for your users
                </li>
              </ul>

              <div className={ styles.bannerButton }>
                { this.props.auth.authenticated
                  ? (
                    <div className={ styles.bannerMessage }>
                      Hi { user.name || user.login }, <a href={`/user/${user.login}`}>let’s take a look at your repos</a>.
                    </div>
                  )
                  : (
                    <Anchor href="/auth/authenticate" isBigger appearance='positive' >
                      Set up in minutes
                      <img className= { styles.icon } src={ octocat } />
                    </Anchor>
                  )
                }
              </div>
            </div>
          </div>
        </div>
        <section className={ `${styles.section} ${styles.sectionTopBorderOnly}` }>
          <div className={ `${containerStyles.wrapper}` }>
            <HeadingTwo className={ styles.landingHeading }>
              Publish your software for
            </HeadingTwo>
            <div className={ `${styles.row}` }>
              <img className={ styles.brandLogo } alt="Debian," src={images.debian} />
              <img className={ styles.brandLogo } alt="openSUSE," src={images.opensuse} />
              <img className={ styles.brandLogo } alt="Arch Linux," src={images.archlinux} />
              <img className={ styles.brandLogo } alt="Gentoo," src={images.gentoo} />
              <img className={ styles.brandLogo } alt="Fedora," src={images.fedora} />
              <img className={ styles.brandLogo } alt="Ubuntu." src={images.ubuntu} />
            </div>
          </div>
        </section>

        <section className={ `${styles.section} ${styles.sectionNoBorder} ${containerStyles.lightStrip}` }>
          <div className={ `${containerStyles.wrapper}` }>
            <HeadingTwo className={ styles.landingHeading }>
              Why use Snapcraft?
            </HeadingTwo>
            <div className={ `${styles.row}` }>
              <ListWithIcon className={ styles.rowItemGrow }>
                <li>Scale to millions of installs</li>
                <li>Automatic updates for everyone</li>
              </ListWithIcon>
              <ListWithIcon className={ styles.rowItemGrow }>
                <li>Available on all clouds and Linux OSes</li>
                <li>Roll back versions effortlessly</li>
              </ListWithIcon>
              <ListWithIcon className={ styles.rowItemGrow }>
                <li>No need for build infrastructure</li>
                <li>FREE for open source projects</li>
              </ListWithIcon>
            </div>
          </div>
        </section>

        <section className={ `${styles.section} ${styles.sectionNoBorder}` }>
          <div className={ `${containerStyles.wrapper}`  }>
            <HeadingTwo className={ styles.landingHeading }>
              How Snapcraft fits into your workflow
            </HeadingTwo>
            <div className={ `${styles.row} `}>
              <img src='https://assets.ubuntu.com/v1/b70a5c55-workflow-illustration.svg' className={ `${styles.centeredImage}`} alt="1: You receive a pull request on GitHub. 2: Test with Travis or other CI system. 3: The code lands on your GitHub master. 4: Snapcraft builds a new snap version. 5: Auto-released to the snap store for testing. 6: You promote to beta, candidate, or stable."/>
            </div>
          </div>

          <div className={ styles.centeredButton }>
            <Anchor href="/auth/authenticate" isBigger appearance='positive'>
              Get started now
              <img className= { styles.icon } src={ octocat } />
            </Anchor>
          </div>
        </section>

        <section className={ `${styles.section} ${styles.sectionNoBorder} ${containerStyles.lightStrip}` }>
          <div className={ `${containerStyles.wrapper} ${styles.row}` }>
            <div className={ `${styles.twoThirds}` }>
              <HeadingTwo className={ styles.landingHeading }>
                Fast to install, easy to create, safe to run
              </HeadingTwo>
              <div>
                <p className={styles.snaps}>With Snapcraft, it&rsquo;s easy to get your software published in the snap store. This store lets people safely install apps from any vendor on mission-critical devices and PCs. Snaps are secure, sandboxed, containerised applications, packaged with their dependencies for predictable behaviour.</p>
                <a href="https://snapcraft.io" className={ styles.external } >More about snaps</a>
              </div>
            </div>
            <div className={styles.oneThird}>
              <img alt="" src='https://assets.ubuntu.com/v1/2c5e93c5-fast-easy-safe-illustration.svg'/>
            </div>
          </div>
        </section>

        <section className={ styles.section }>
          <div className={ `${containerStyles.wrapper}` }>
            <HeadingThree>
              What people are saying about snaps
            </HeadingThree>

            <div className={ `${styles.row}` }>

              <div className={ styles.oneThird }>
                <Testimonial citation='Frank Karlitschek, NextCloud' logo='https://assets.ubuntu.com/v1/99a0b969-Nextcloud_Logo.svg'>
                  Snaps provide an excellent way to distribute updates in a way that is both secure and does not risk breaking end user devices.
                </Testimonial>
              </div>

              <div className={ styles.oneThird }>
                <Testimonial citation='Mac Devine, IBM' logo='https://assets.ubuntu.com/v1/683950fd-logo-ibm.svg'>
                  Snaps allow developers to build and deploy applications in a format that’s easily portable and upgradeable across a number of IoT devices so that a cognitive relationship between the cloud and the edges of the network can be established.
                </Testimonial>
              </div>

              <div className={ styles.oneThird }>
                <Testimonial citation='Aaron Ogle, Rocket.Chat' logo='https://assets.ubuntu.com/v1/1ad274f9-rocket-chat.svg'>
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
  auth: PropTypes.object,
  user: PropTypes.object
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

export default connect(mapStateToProps)(Landing);
