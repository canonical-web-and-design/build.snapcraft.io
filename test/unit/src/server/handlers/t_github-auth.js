import expect from 'expect';
import { spy, stub } from 'sinon';
import {
  logout,
  errorHandler
} from '../../../../../src/server/handlers/github-auth.js';

describe('login', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      session: {
        destroy: stub().callsArg(0)
      }
    };
    res = {
      send: spy(),
      redirect: spy()
    },
    next = spy();
  });

  describe('logout handler', () => {

    it('destroys session', () => {
      logout(req, res, next);
      expect(req.session.destroy.calledOnce).toBe(true);
    });

    it('on success redirects to snapcraft.io/logout?no_redirect=true', () => {
      req.session.destroy.callsArgWith(0, false);
      logout(req, res, next);
      expect(res.redirect.calledWith('https://snapcraft.io/logout?no_redirect=true')).toBe(true);
    });

    it('on error calls next with error', () => {
      req.session.destroy.callsArgWith(0, true);
      logout(req, res, next);
      expect(next.calledWithMatch((arg) => {
        return arg instanceof Error && arg.message === 'Failed to log out.';
      })).toBe(true);
    });

  });

  describe('error handler', () => {

    it('should put error message on session error prop', () => {
      const message = 'abcdef';
      errorHandler(new Error(message), req, res, next);
      expect(req.session.error).toBe(message);
    });

  });
});
