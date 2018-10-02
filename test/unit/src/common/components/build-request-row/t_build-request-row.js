import React from 'react';
import expect from 'expect';
import { shallow } from 'enzyme';

import BuildRequestRow from '../../../../../../src/common/components/build-request-row';
import { BUILD_TRIGGER_UNKNOWN, BUILD_TRIGGERED_BY_WEBHOOK } from '../../../../../../src/common/helpers/build_annotation';

describe('<BuildRequestRow />', function() {
  const TEST_BUILD_REQUEST = {
    isRequest: true,
    buildId: '123456',
    statusMessage: 'Building soon',
    colour: 'grey',
    dateCreated: '2016-11-09T17:05:52.436792+00:00',
    errorMessage: null,
    reason: BUILD_TRIGGER_UNKNOWN
  };
  const TEST_REPO = {
    fullName: 'anowner/aname'
  };

  let element;

  it('should display pending build request', () => {
    element = shallow(
      <BuildRequestRow repository={TEST_REPO} {...TEST_BUILD_REQUEST} />
    );

    const dataRows = element.find('Data');
    expect(dataRows.length).toBe(3);
    expect(shallow(dataRows.get(0)).text()).toEqual('Requested');
    expect(shallow(dataRows.get(1)).text()).toEqual('Unknown');
    expect(shallow(dataRows.get(2)).text()).toEqual('');
  });

  it('should display build reason', () => {
    const request = {
      ...TEST_BUILD_REQUEST,
      reason: BUILD_TRIGGERED_BY_WEBHOOK
    };

    element = shallow(<BuildRequestRow repository={TEST_REPO} {...request} />);

    const dataRows = element.find('Data');
    expect(dataRows.length).toBe(3);
    expect(shallow(dataRows.get(1)).text()).toEqual('Commit');
  });

  it('should display failed build request', () => {
    const request = {
      ...TEST_BUILD_REQUEST,
      statusMessage: 'Failed to build',
      errorMessage: 'Boom'
    };

    element = shallow(<BuildRequestRow repository={TEST_REPO} {...request} />);

    const dataRows = element.find('Data');
    expect(dataRows.length).toBe(3);
    expect(shallow(dataRows.get(0)).text()).toEqual('Requested');
    expect(shallow(dataRows.get(1)).text()).toEqual('Unknown');
    expect(shallow(dataRows.get(2)).html()).toInclude(
      '(Request #123456) Boom'
    );
  });
});
