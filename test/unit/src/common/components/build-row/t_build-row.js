import React from 'react';
import expect from 'expect';
import { shallow } from 'enzyme';
import { Link } from 'react-router';

import BuildRow from '../../../../../../src/common/components/build-row';
import { Row, Data } from '../../../../../../src/common/components/vanilla/table-interactive';
import { BUILD_TRIGGER_UNKNOWN } from '../../../../../../src/common/helpers/build_annotation';

describe('<BuildRow />', function() {
  const TEST_BUILD = {
    buildId:  '1234',
    buildLogUrl: 'http://example.com/12344567890_BUILDING.txt.gz',
    architecture: 'arch',
    colour: 'green',
    statusMessage: 'Build test status',
    dateStarted: '2017-03-07T12:29:45.297305+00:00',
    duration: '0:01:24.425045',
    reason: BUILD_TRIGGER_UNKNOWN
  };
  const TEST_REPO = {
    fullName: 'anowner/aname'
  };

  let element;

  it('should display build reason column', () => {
    element = shallow(<BuildRow repository={TEST_REPO} {...TEST_BUILD} />);

    expect(element.find('Data').length).toBe(5);

    const column = shallow(element.find(Data).get(3));
    expect(column.html()).toInclude('Unknown');
  });

  context('when build log is available', () => {
    beforeEach(() => {
      element = shallow(<BuildRow repository={TEST_REPO} {...TEST_BUILD} />);
    });

    it('should render Row', () => {
      expect(element.type()).toBe(Row);
    });

    it('should contain Link to build page', () => {
      const expectedUrl = `/user/${TEST_REPO.fullName}/${TEST_BUILD.buildId}`;
      expect(element.find(Link).length).toBe(1);
      expect(element.find(Link).prop('to')).toBe(expectedUrl);
    });

    it('should contain BuildStatus linked to build page', () => {
      const expectedUrl = `/user/${TEST_REPO.fullName}/${TEST_BUILD.buildId}`;
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
