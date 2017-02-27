import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import { Link } from 'react-router';

import BuildRow from '../components/build-row';
import { Table, Head, Body, Row, Header } from '../components/vanilla/table-interactive';
import BuildLog from '../components/build-log';
import { Message } from '../components/forms';
import HelpInstallSnap from '../components/help/install-snap';
import { HeadingOne, HeadingThree } from '../components/vanilla/heading';
import Spinner from '../components/spinner';

import withRepository from './with-repository';
import { fetchBuilds, fetchSnap } from '../actions/snap-builds';
import { snapBuildsInitialStatus } from '../reducers/snap-builds';

import styles from './container.css';

class BuildDetails extends Component {

  fetchData({ snap, repository }) {
    if (snap) {
      this.props.dispatch(fetchBuilds(repository.url, snap.self_link));
    } else if (repository) {
      this.props.dispatch(fetchSnap(repository.url));
    }
  }

  componentDidMount() {
    this.fetchData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    const currentSnap = this.props.snap;
    const nextSnap = nextProps.snap;
    const currentRepository = this.props.repository.fullName;
    const nextRepository = nextProps.repository.fullName;

    if ((currentSnap !== nextSnap) || (currentRepository !== nextRepository)) {
      // if snap or repo changed, fetch new data
      this.fetchData(nextProps);
    }
  }

  render() {
    const { snap, repository, buildId, build, error, isFetching } = this.props;

    return (
      <div className={ styles.container }>
        <Helmet
          title={`${repository.fullName} builds`}
        />
        <HeadingOne>
          <Link to={`/${repository.fullName}/builds`}>{repository.fullName}</Link> build #{buildId}
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
        { isFetching &&
          <div className={styles.spinner}><Spinner /></div>
        }
        { snap &&
          <HelpInstallSnap
            headline='To test the latest successful build on your PC or cloud instance:'
            name={ snap.store_name }
          />
        }
      </div>
    );
  }

}
BuildDetails.propTypes = {
  repository: PropTypes.shape({
    owner: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    fullName: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired
  }).isRequired,
  buildId: PropTypes.string.isRequired,
  build: PropTypes.object,
  isFetching: PropTypes.bool,
  snap: PropTypes.shape({
    self_link: PropTypes.string.isRequired,
    store_name: PropTypes.string.isRequired
  }),
  error: PropTypes.object,
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = (state, ownProps) => {
  const owner = ownProps.params.owner.toLowerCase();
  const name = ownProps.params.name.toLowerCase();
  const fullName = `${owner}/${name}`;
  const repository = state.repository;

  const buildId = ownProps.params.buildId.toLowerCase();

  // get builds for given repo from the store or set default empty values
  const repoBuilds = state.snapBuilds[fullName] || snapBuildsInitialStatus;

  const build = repoBuilds.builds.filter((build) => build.buildId === buildId)[0];
  const isFetching = repoBuilds.isFetching;
  const error = repoBuilds.error;
  const snap = repoBuilds.snap;

  return {
    fullName,
    repository,
    buildId,
    build,
    isFetching,
    snap,
    error
  };
};

export default connect(mapStateToProps)(withRepository(BuildDetails));
