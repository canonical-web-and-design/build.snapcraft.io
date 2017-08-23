import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';

import BuildRow from '../components/build-row';
import { Table, Head, Body, Row, Header } from '../components/vanilla/table-interactive';
import BuildLog from '../components/build-log';
import {
  HelpBox,
  HelpInstallSnap,
  HelpPromoteSnap
} from '../components/help';
import { HeadingOne, HeadingThree } from '../components/vanilla-modules/heading';
import { IconSpinner } from '../components/vanilla-modules/icons';
import Breadcrumbs, { BreadcrumbsLink } from '../components/vanilla-modules/breadcrumbs';
import BetaNotification from '../components/beta-notification';
import Notification from '../components/vanilla-modules/notification';
import withRepository from './with-repository';
import withSnapBuilds from './with-snap-builds';

import styles from './container.css';

class BuildDetails extends Component {
  render() {
    const { user, repository, buildId, build, snap } = this.props;
    const { error, isFetching } = this.props.snapBuilds;

    const buildFailed = (build.statusMessage === 'Failed to build');
    const buildFailedToUpload = (build.storeUploadStatus === 'Failed to upload'
                              || build.storeUploadStatus === 'Failed to release to channels');
    const showBuildUploadErrorMessage = buildFailedToUpload && build.storeUploadErrorMessage;

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
    } else if (snap && snap.storeName && build.storeRevision) {
      // otherwise if we have snap name and revision show install instructions
      helpBox = (
        <HelpBox>
          <HelpInstallSnap
            headline='To test this build on your PC or cloud instance:'
            name={ snap.storeName }
            revision={ build.storeRevision }
            hasCopyButton
          />
          { snap.snapcraftData &&
            <HelpPromoteSnap
              name={snap.storeName}
              revision={build.storeRevision}
              confinement={snap.snapcraftData.confinement}
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
            <BreadcrumbsLink to={`/user/${user.login}`}>My repos</BreadcrumbsLink>
          }
          {' ' /* vanilla assumes space between breadcrumb elements */}
          <BreadcrumbsLink to={`/user/${repository.fullName}`}>{repository.fullName}</BreadcrumbsLink>
          {' ' /* vanilla assumes space between breadcrumb elements */}
          <BreadcrumbsLink>&nbsp;</BreadcrumbsLink> {/* hack to show arrow after last breadcrumb item */}
        </Breadcrumbs>
        <HeadingOne>
          Build #{buildId}
        </HeadingOne>
        { error &&
          <Notification appearance='negative' status='error'>{ error.message || error }</Notification>
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
            {
              showBuildUploadErrorMessage &&
              <div className={ styles.strip }>
                <HeadingThree>Build failed to release</HeadingThree>
                <Notification appearance='negative' status='error'>{ build.storeUploadErrorMessage }</Notification>
              </div>
            }
            <div className={ styles.strip }>
              <HeadingThree>Build log</HeadingThree>
              <BuildLog logUrl={build.buildLogUrl} />
            </div>
          </div>
        }
        { helpBox }
        { isFetching &&
          <IconSpinner />
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
  snap: PropTypes.shape({
    selfLink: PropTypes.string.isRequired,
    storeName: PropTypes.string.isRequired
  }),
  snapBuilds: PropTypes.shape({
    isFetching: PropTypes.bool,
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
