import React from 'react';
import expect from 'expect';
import { shallow } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import RepositoryRow from '../../../../../../src/common/components/repository-row';
import { Row } from '../../../../../../src/common/components/vanilla/table-interactive';

const middlewares = [ thunk ];
const mockStore = configureMockStore(middlewares);

describe('<RepositoryRow />', () => {
  const snap = {
    git_repository_url: 'https://github.com/anowner/aname',
    store_name: 'test-snap',
    snapcraft_data: { name: 'test-snap' }
  };
  const latestBuild = {
    buildId:  '1234',
    buildLogUrl: 'http://example.com/12344567890_BUILDING.txt.gz',
    architecture: 'arch',
    colour: 'green',
    statusMessage: 'Build test status',
    dateStarted: '2017-03-07T12:29:45.297305+00:00',
    duration: '0:01:24.425045'
  };
  const fullName = 'anowner/aname';
  const authStore = {
    authenticated: true,
    userName: 'store-user'
  };
  const registerNameStatus = {
    success: true
  };

  let store;
  let view;

  beforeEach(() => {
    store = mockStore({});
  });

  context('when latest build log is available', () => {
    beforeEach(() => {
      // shallow render container component and get view from it
      view = shallow(
        <RepositoryRow
          store={store}
          snap={snap}
          latestBuild={latestBuild}
          fullName={fullName}
          authStore={authStore}
          registerNameStatus={registerNameStatus}
        />)
        .find('RepositoryRow').dive();
    });

    it('should render Row', () => {
      expect(view.type()).toEqual(Row);
    });

    it('should contain BuildStatus linked to build page', () => {
      const expectedUrl = `/${fullName}/builds/${latestBuild.buildId}`;
      expect(view.find('BuildStatus').length).toBe(1);
      expect(view.find('BuildStatus').prop('link')).toBe(expectedUrl);
    });
  });

  context('when latest build log is not yet available', () => {
    beforeEach(() => {
      const buildWithoutLog = {
        ...latestBuild,
        buildLogUrl: null
      };

      // shallow render container component and get view from it
      view = shallow(
        <RepositoryRow
          store={store}
          snap={snap}
          latestBuild={buildWithoutLog}
          fullName={fullName}
          authStore={authStore}
          registerNameStatus={registerNameStatus}
        />)
        .find('RepositoryRow').dive();
    });

    it('should contain BuildStatus not linked to build page', () => {
      expect(view.find('BuildStatus').length).toBe(1);
      expect(view.find('BuildStatus').prop('link')).toBe(null);
    });
  });

});
