import expect from 'expect';
import proxyquire from 'proxyquire';

import * as fixtures from './fixtures.js';
import * as RepoActionTypes from '../../../../../../src/common/actions/repository';

const repoSpy = expect.createSpy();
const entities = proxyquire('../../../../../../src/common/reducers/entities', {
  './repository': {
    default: repoSpy
  }
}).entities;

describe('entities', function() {
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
  });

  context('repository helper', function() {

    for (let type in RepoActionTypes) {
      it(`should call the repository spy for ${type}`, function() {
        entities(fixtures.initialState, {
          type: type,
          payload: {
            id: 1001
          }
        });
        expect(repoSpy).toHaveBeenCalled();
      });
    }
  });
});
