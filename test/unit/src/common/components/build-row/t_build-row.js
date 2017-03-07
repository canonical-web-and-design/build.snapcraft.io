import React from 'react';
import expect from 'expect';
import { shallow } from 'enzyme';
import { Link } from 'react-router';

import BuildRow from '../../../../../../src/common/components/build-row';
import { Row } from '../../../../../../src/common/components/vanilla/table-interactive';

describe('<BuildRow />', function() {
  const TEST_BUILD = {
    buildId:  '1234',
    buildLogUrl: 'http://example.com/12344567890_BUILDING.txt.gz',
    architecture: 'arch',
    colour: 'green',
    statusMessage: 'Build test status',
    dateStarted: '2017-03-07T12:29:45.297305+00:00',
    duration: '0:01:24.425045'
  };
  const TEST_REPO = {
    fullName: 'anowner/aname'
  };

  let element;

  context('when build log is available', () => {
    beforeEach(() => {
      element = shallow(<BuildRow repository={TEST_REPO} {...TEST_BUILD} />);
    });

    it('should render Row', () => {
      expect(element.type()).toBe(Row);
    });

    it('should contain Link to build page', () => {
      const expectedUrl = `/${TEST_REPO.fullName}/builds/${TEST_BUILD.buildId}`;
      expect(element.find(Link).length).toBe(1);
      expect(element.find(Link).prop('to')).toBe(expectedUrl);
    });

    it('should contain BuildStatus linked to build page', () => {
      const expectedUrl = `/${TEST_REPO.fullName}/builds/${TEST_BUILD.buildId}`;
      expect(element.find('BuildStatus').length).toBe(1);
      expect(element.find('BuildStatus').prop('link')).toBe(expectedUrl);
    });
  });

  context('when build log is not yet available', () => {
    beforeEach(() => {
      const buildWithoutLog = {
        ...TEST_BUILD,
        buildLogUrl: null
      };

      element = shallow(<BuildRow repository={TEST_REPO} {...buildWithoutLog} />);
    });

    it('should not contain Link to build page', () => {
      expect(element.find(Link).length).toBe(0);
    });

    it('should contain BuildStatus not linked to build page', () => {
      expect(element.find('BuildStatus').length).toBe(1);
      expect(element.find('BuildStatus').prop('link')).toBe(null);
    });
  });
});
