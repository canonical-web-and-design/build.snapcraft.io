import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import { snapBuildsInitialStatus } from '../../reducers/snap-builds';
import BuildRow from '../build-row';
import { Table, Head, Body, Row, Header } from '../vanilla/table-interactive';
import Notification from '../vanilla-modules/notification';

import styles from './buildHistory.css';

export const BuildHistory = (props) => {
  const { repository, success, builds } = props;

  const hasBuilds = (builds && builds.length > 0);

  if (!success) {
    return null;
  }

  if (!hasBuilds) {
    return (
      <div className={styles.notificationWrapper}>
        <Notification status='information' appearance="information">This snap has not been built yet.</Notification>
      </div>
    );
  }

  const buildRows = builds
    .sort((a,b) => ((+b.buildId) - (+a.buildId)))
    .map((build) => (
      <BuildRow key={build.buildId} {...build} repository={repository} />
    ));

  return (
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
        { buildRows }
      </Body>
    </Table>
  );
};

BuildHistory.propTypes = {
  repository: PropTypes.shape({
    owner: PropTypes.string,
    name: PropTypes.string,
    fullName: PropTypes.string
  }),
  success: PropTypes.bool,
  builds: React.PropTypes.arrayOf(React.PropTypes.object)
};

function mapStateToProps(state, ownProps) {
  const { fullName } = ownProps.repository;

  // get builds for given repo from the store or set default empty values
  const repoBuilds = state.snapBuilds[fullName] || snapBuildsInitialStatus;
  const { builds, success } = repoBuilds;

  return {
    builds,
    success
  };
}

export default connect(mapStateToProps)(BuildHistory);
