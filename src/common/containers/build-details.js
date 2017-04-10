import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import { Link } from 'react-router';

import BuildRow from '../components/build-row';
import { Table, Head, Body, Row, Header } from '../components/vanilla/table-interactive';
import BuildLog from '../components/build-log';
import { Message } from '../components/forms';
import {
  HelpBox,
  HelpInstallSnap,
  HelpPromoteSnap
} from '../components/help';
import { HeadingOne, HeadingThree } from '../components/vanilla/heading';
import Spinner from '../components/spinner';
import Breadcrumbs from '../components/vanilla/breadcrumbs';
import BetaNotification from '../components/beta-notification';

import withRepository from './with-repository';
import withSnapBuilds from './with-snap-builds';

import styles from './container.css';

class BuildDetails extends Component {
  render() {
    const { user, repository, buildId, build } = this.props;
    const { snap, error, isFetching } = this.props.snapBuilds;

    const buildFailed = (build.statusMessage === 'Failed to build');
    let helpBox;

    if (buildFailed) {
      // if build has failed show snapcraft debug instruction
      helpBox = (
        <HelpBox>
          <HelpInstallSnap headline='To debug this build:'>
            sudo snap install lxd # if you don’t have LXD already<br/>
            sudo snap install --classic --edge snapcraft # if you don’t have snapcraft already<br/>
            <br/>
            git clone {repository.url}<br/>
            cd {repository.name}<br/>
            snapcraft cleanbuild --debug
          </HelpInstallSnap>
        </HelpBox>
      );
    } else if (snap && snap.store_name && build.storeRevision) {
      // otherwise if we have snap name and revision show install instructions
      helpBox = (
        <HelpBox>
          <HelpInstallSnap
            headline='To test this build on your PC or cloud instance:'
            name={ snap.store_name }
            revision={ build.storeRevision }
          />
          { snap.snapcraft_data &&
            <HelpPromoteSnap
              name={snap.store_name}
              revision={build.storeRevision}
              confinement={snap.snapcraft_data.confinement}
            />
          }
        </HelpBox>
      );
    }

    return (
      <div className={ styles.container }>
        <Helmet
          title={`${repository.fullName} builds`}
        />
        <BetaNotification />
        <Breadcrumbs>
          { user &&
            <Link to={`/user/${user.login}`}>My repos</Link>
          }
          <Link to={`/user/${repository.fullName}`}>{repository.fullName}</Link>
        </Breadcrumbs>
        <HeadingOne>
          Build #{buildId}
        </HeadingOne>
        { error &&
          <Message status='error'>{ error.message || error }</Message>
        }
        { build &&
          <div>
            <Table>
              <Head>
                <Row>
                  <Header col="20">Number</Header>
                  <Header col="20">Architecture</Header>
                  <Header col="20">Duration</Header>
                  <Header col="40">Result</Header>
                </Row>
              </Head>
              <Body>
                <BuildRow repository={repository} {...build} />
              </Body>
            </Table>
            <div className={ styles.strip }>
              <HeadingThree>Build log</HeadingThree>
              <BuildLog logUrl={build.buildLogUrl} />
            </div>
          </div>
        }
        { helpBox }
        { isFetching &&
          <div className={styles.spinner}><Spinner /></div>
        }
      </div>
    );
  }

}
BuildDetails.propTypes = {
  user: PropTypes.object,
  repository: PropTypes.shape({
    owner: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    fullName: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired
  }).isRequired,
  buildId: PropTypes.string.isRequired,
  build: PropTypes.object,
  snapBuilds: PropTypes.shape({
    isFetching: PropTypes.bool,
    snap: PropTypes.shape({
      self_link: PropTypes.string.isRequired,
      store_name: PropTypes.string.isRequired
    }),
    error: PropTypes.object,
  })
};

const mapStateToProps = (state, ownProps) => {
  const buildId = ownProps.params.buildId;
  const build = ownProps.snapBuilds.builds.filter((build) => build.buildId === buildId)[0];

  return {
    user: state.user,
    buildId,
    build
  };
};

export default withRepository(withSnapBuilds(connect(mapStateToProps)(BuildDetails)));
