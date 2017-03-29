import React from 'react';
import expect from 'expect';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

import { BetaNotificationView } from '../../../../../../src/common/components/beta-notification';

// importing BetaNotificationTriggerView through proxyquire to stub localforage
import { makeLocalForageStub } from '../../../../../helpers';
const localForageStub = makeLocalForageStub();
const BetaNotificationTriggerView = proxyquire.noCallThru().load(
  '../../../../../../src/common/components/beta-notification/trigger',
  { 'localforage': localForageStub }
).BetaNotificationTriggerView;

describe('<BetaNotificationView />', () => {
  it('should not render if notification visibility is set to false', () => {
    const wrapper = shallow(<BetaNotificationView isVisible={false} />);
    expect(wrapper.type()).toBe(null);
  });

  it('should not render Notification visibility is set to true', () => {
    const wrapper = shallow(<BetaNotificationView isVisible={true} />);
    expect(wrapper.is('Notification')).toBe(true);
  });
});


describe('<BetaNotificationTriggerView />', () => {
  let clock;

  before(() => {
    clock = sinon.useFakeTimers();
  });

  after(() => {
    clock.restore();
  });

  context('when user is logged in', () => {
    let wrapper;
    let callback;

    beforeEach(async () => {
      callback = expect.createSpy();
      wrapper = shallow(<BetaNotificationTriggerView authenticated={true} showNotification={callback}/>);

      // componentDidMount is async because of internal localforage usage
      // and because mocked localforage uses setTimeout to call async callbacks
      // we need to first store reference to componentDidMount promise:
      const componentDidMount = wrapper.instance().componentDidMount();
      // and then tick the mocked clock to make localforage resolve properly
      clock.tick(1);
      // and finally we can wait for componentDidMount to fully resolve
      await componentDidMount;
    });

    afterEach(() => {
      wrapper.instance().componentWillUnmount();
    });

    it('should call showNotification callback after 2 minutes', () => {
      expect(callback).toNotHaveBeenCalled();
      clock.tick(2 * 60 * 1000); // wait for 2 minutes
      expect(callback).toHaveBeenCalled();
    });
  });

});
