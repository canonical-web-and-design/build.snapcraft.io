import expect from 'expect';
import React from 'react';
import { shallow } from 'enzyme';

import PageLinks from '../../../../../../src/common/components/page-links';

describe('The PageLinks component', () => {
  let props;

  beforeEach(() => {
    props = {};
  });

  context('when a link prop is the string "/pages/2"', () => {
    beforeEach(() => {
      props['first'] = '/pages/2';
    });

    it('should render a link with an href "/pages/2"', () => {
      let component = shallow(<PageLinks { ...props} />);
      expect(component.find('a[href="/pages/2"]').length).toBe(1);
    });

    context('and when supplied an onClick callback prop', () => {
      let callbackSpy = expect.createSpy();

      beforeEach(() => {
        props['onClick'] = callbackSpy;
      });

      it('should call onClick with "/pages/2" when link is clicked', () => {
        let component = shallow(<PageLinks { ...props} />);
        component.instance().onClick('/pages/2');
        expect(callbackSpy).toHaveBeenCalledWith('/pages/2');
      });
    });
  });

  context('when a link prop is the number "3"', () => {
    beforeEach(() => {
      props['first'] = 3;
    });

    it('should render without an href attribute', () => {
      let component = shallow(<PageLinks { ...props} />);
      expect(component.find('a[href]').length).toBe(0);
    });

    context('and when supplied an onClick callback prop', () => {
      let callbackSpy = expect.createSpy();

      beforeEach(() => {
        props['onClick'] = callbackSpy;
      });

      it('should call onClick with "3" when link is clicked', () => {
        let component = shallow(<PageLinks { ...props} />);
        component.instance().onClick(3);
        expect(callbackSpy).toHaveBeenCalledWith(3);
      });
    });
  });

  context('when a link prop is not set', () => {
    beforeEach(() => {
      props['first'] = undefined;
    });

    it('should render an unclickable label', () => {
      let component = shallow(<PageLinks { ...props } />);
      expect(component.containsMatchingElement(<div>first</div>)).toEqual(true);
    });
  });
});
