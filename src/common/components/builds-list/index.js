import PropTypes from 'prop-types';
import React from 'react';

import BuildRequestRow from '../build-request-row';
import BuildRow from '../build-row';
import { Table, Head, Body, Row, Header } from '../vanilla/table-interactive';
import Notification from '../vanilla-modules/notification';

import styles from './buildsList.css';

export const BuildsList = (props) => {
  const { repository, builds } = props;

  const hasBuilds = (builds && builds.length > 0);

  if (!hasBuilds) {
    return (
      <div className={styles.notificationWrapper}>
        <Notification status='information' appearance="information">This snap has not been built yet.</Notification>
      </div>
    );
  }

  const buildRows = builds
    .sort((a,b) => ((+b.buildId) - (+a.buildId)))
    .map((build) => {
      if (build.isRequest) {
        return (
          <BuildRequestRow
            key={ `request_${build.buildId}` }
            {...build}
            repository={repository}
          />
        );
      } else {
        return (
          <BuildRow key={build.buildId} {...build} repository={repository} />
        );
      }
    });

  return (
    <Table>
      <Head>
        <Row>
          <Header col="15">Number</Header>
          <Header col="20">Build trigger</Header>
          <Header col="15">Architecture</Header>
          <Header col="15">Duration</Header>
          <Header col="35">Result</Header>
        </Row>
      </Head>
      <Body>
        { buildRows }
      </Body>
    </Table>
  );
};

BuildsList.propTypes = {
  repository: PropTypes.shape({
    owner: PropTypes.string,
    name: PropTypes.string,
    fullName: PropTypes.string
  }),
  builds: PropTypes.arrayOf(PropTypes.object)
};



export default BuildsList;
