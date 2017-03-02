import expect from 'expect';
import React from 'react';
import { shallow } from 'enzyme';

import SelectRepositoryRow from '../../../../../../src/common/components/select-repository-row';

describe('The SelectRepositoryRow component', () => {
  let props;

  beforeEach(() => {
    props = {};
  });

  context('when a repository is supplied', () => {
    beforeEach(() => {
      props.repository = {
        fullName: 'katiefenn/parker'
      };
    });

    it('should display a label with the name of the repository', () => {
      const component = shallow(<SelectRepositoryRow { ...props } />);

      expect(component.containsMatchingElement(<div>katiefenn/parker</div>));
    });

    context('and the errorMsg prop is "Something happened"', () => {
      beforeEach(() => {
        props.errorMsg = 'Something happened';
      });

      it('should contain an error message "Something happened"', () => {
        const component = shallow(<SelectRepositoryRow { ...props } />);
        expect(component.containsMatchingElement(<div>Something happened</div>)).toEqual(true);
      });
    });

    context('and a onChange callback is supplied', () => {
      let onChange = expect.createSpy();

      beforeEach(() => {
        props.onChange = onChange;
      });

      context('when checkbox is changed', () => {
        let component;

        beforeEach(() => {
          component = shallow(<SelectRepositoryRow { ...props } />);
          component.instance().onChange();
        });

        it('shoud call the onChange callback', () => {
          expect(onChange).toHaveBeenCalled();
        });
      });

      context('and the checked prop is "true"', () => {
        beforeEach(() => {
          props.checked = true;
        });

        it('should contain a checked checkbox', () => {
          const component = shallow(<SelectRepositoryRow { ...props } />);
          expect(component.find('input[checked=true]').length).toBe(1);
        });
      });

      context('and the checked prop is "false"', () => {
        beforeEach(() => {
          props.checked = false;
        });

        it('should contain an unchecked checkbox', () => {
          const component = shallow(<SelectRepositoryRow { ...props } />);
          expect(component.find('input[checked=false]').length).toBe(1);
        });
      });

      context('and the isEnabled prop is "true"', () => {
        beforeEach(() => {
          props.isEnabled = true;
        });

        it('should contain a disabled checkbox', () => {
          const component = shallow(<SelectRepositoryRow { ...props } />);
          expect(component.find('input[disabled=true]').length).toBe(1);
        });

        it('should contain a checked checkbox', () => {
          const component = shallow(<SelectRepositoryRow { ...props } />);
          expect(component.find('input[checked=true]').length).toBe(1);
        });
      });
    });
  });
});
