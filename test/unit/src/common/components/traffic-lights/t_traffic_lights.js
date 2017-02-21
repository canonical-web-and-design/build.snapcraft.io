import React from 'react';
import expect from 'expect';
import { shallow } from 'enzyme';

import TrafficLights, { SIGNALS, Signal } from '../../../../../../src/common/components/traffic-lights';

describe('<TrafficLights />', function() {

  let wrapper;

  beforeEach(function() {
    const state = [
      SIGNALS.DEFAULT,
      SIGNALS.DEFAULT,
      SIGNALS.DEFAULT
    ];
    wrapper = shallow(<TrafficLights signalState={ state } />);
  });

  it('should include <Signal /> elements', function() {
    expect(wrapper.containsMatchingElement(<Signal />));
  });

  it('should have 3 children', function() {
    expect(wrapper.children().length).toBe(3);
  });

  it('should have <Signal> state consitent with parent constructor props', function() {
    const total = wrapper.find(Signal).reduce(
      (val, node) => val + node.prop('state'), 0
    );

    expect(total).toBe(0);
  });

  it('should update <Signal> on setting props', function() {
    const nextProps = {
      signalState: [
        SIGNALS.DONE,
        SIGNALS.ACTIVE,
        SIGNALS.DEFAULT
      ]
    };

    wrapper.setProps(nextProps);

    const total = wrapper.find(Signal).reduce(
      (val, node) => val + node.prop('state'), 0
    );

    expect(total).toBe(3);
  });

});
