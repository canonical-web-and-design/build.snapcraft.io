import expect from 'expect';
import proxyquire from 'proxyquire';

import * as fixtures from './fixtures.js';
import * as RepoActionTypes from '../../../../../../src/common/actions/repository';
import * as SnapsActionTypes from '../../../../../../src/common/actions/snaps';
import * as RegisterNameActionTypes from '../../../../../../src/common/actions/register-name';

describe('entities reducer', function() {
  let repoSpy;
  let snapSpy;

  let entities;

  beforeEach(() => {
    repoSpy = expect.createSpy();
    snapSpy = expect.createSpy();

    entities = proxyquire('../../../../../../src/common/reducers/entities', {
      './repository': {
        default: repoSpy
      },
      './snap': {
        default: snapSpy
      }
    }).entities;
  });

  afterEach(() => {
    expect.restoreSpies();
  });

  context('slice reducer', function() {
    // "Redux will call our reducer with an undefined state for the first time.
    // This is our chance to return the initial state of our app"
    // -- http://redux.js.org/docs/basics/Reducers.html
    it('should define initial state of store', function() {
      expect(entities(undefined, { type: 'ANY' }))
        .toEqual(fixtures.initialState);
    });

    it('should return previous state for unknown action', function() {
      expect(entities(fixtures.initialState, { type: 'UNKNOWN' }))
        .toBe(fixtures.initialState);
    });

    it('should return new entities state if entities property is in action payload', function() {
      expect(entities(fixtures.initialState, {
        type: 'ANY',
        payload: fixtures.payload
      }))
        .toEqual(fixtures.finalState)
        .toNotBe(fixtures.finalState);
    });

    context('repository helper', function() {

      for (let type in RepoActionTypes) {
        it(`should call the repository reducer for ${type}`, function() {
          entities(fixtures.initialState, {
            type: type,
            payload: {
              id: 1001
            }
          });
          expect(repoSpy).toHaveBeenCalled();
        });
      }

      it('should call the snap reducer for REGISTER_NAME_SUCCESS', function() {
        entities(fixtures.initialState, {
          type: RegisterNameActionTypes.REGISTER_NAME_SUCCESS,
          payload: {
            id: 'https://github.com/anowner/aname'
          }
        });
        expect(snapSpy).toHaveBeenCalled();
      });

      for (let type in SnapsActionTypes) {
        it(`should call the repository reducer for ${type}`, function() {
          const action = {
            type: type,
            payload: {
              id: 'https://github.com/anowner/aname'
            }
          };

          entities(fixtures.initialState, action);
          expect(snapSpy).toHaveBeenCalledWith(fixtures.initialState[action.payload.id], action);
        });
      }

    });
  });
});
