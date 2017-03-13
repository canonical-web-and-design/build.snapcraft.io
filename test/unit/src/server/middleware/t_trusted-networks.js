import expect from 'expect';
import ipaddr from 'ipaddr.js';

import { matchNetworks } from '../../../../../src/server/middleware/trusted-networks';

describe.only('matchNetworks', () => {
  context('with no trusted networks', () => {
    it('accepts loopback IPv4 address', () => {
      expect(matchNetworks('127.0.0.1', [])).toBe(true);
    });

    it('accepts loopback IPv6 address', () => {
      expect(matchNetworks('::1', [])).toBe(true);
    });

    it('rejects another IPv4 address', () => {
      expect(matchNetworks('8.8.8.8', [])).toBe(false);
    });

    it('rejects another IPv6 address', () => {
      expect(matchNetworks('2001:db8::1', [])).toBe(false);
    });
  });

  context('with only IPv4 trusted networks', () => {
    const networks = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'].map(
      (cidr) => ipaddr.parseCIDR(cidr)
    );

    it('accepts loopback IPv4 address', () => {
      expect(matchNetworks('127.0.0.1', networks)).toBe(true);
    });

    it('accepts loopback IPv6 address', () => {
      expect(matchNetworks('::1', networks)).toBe(true);
    });

    it('accepts trusted IPv4 address', () => {
      expect(matchNetworks('10.0.0.1', networks)).toBe(true);
      expect(matchNetworks('172.16.0.1', networks)).toBe(true);
      expect(matchNetworks('192.168.0.1', networks)).toBe(true);
    });

    it('rejects another IPv4 address', () => {
      expect(matchNetworks('192.0.2.1', networks)).toBe(false);
    });

    it('rejects another IPv6 address', () => {
      expect(matchNetworks('2001:db8::1', networks)).toBe(false);
    });
  });

  context('with only IPv6 trusted networks', () => {
    const networks = ['2001:db8::/64'].map((cidr) => ipaddr.parseCIDR(cidr));

    it('accepts loopback IPv4 address', () => {
      expect(matchNetworks('127.0.0.1', networks)).toBe(true);
    });

    it('accepts loopback IPv6 address', () => {
      expect(matchNetworks('::1', networks)).toBe(true);
    });

    it('accepts trusted IPv6 address', () => {
      expect(matchNetworks('2001:db8::1', networks)).toBe(true);
    });

    it('rejects another IPv4 address', () => {
      expect(matchNetworks('192.0.2.1', networks)).toBe(false);
    });

    it('rejects another IPv6 address', () => {
      expect(matchNetworks('2001:db8:1::1', networks)).toBe(false);
    });
  });

  context('with both IPv4 and IPv6 trusted networks', () => {
    const networks = ['10.0.0.0/8', '2001:db8::/64'].map(
      (cidr) => ipaddr.parseCIDR(cidr)
    );

    it('accepts loopback IPv4 address', () => {
      expect(matchNetworks('127.0.0.1', networks)).toBe(true);
    });

    it('accepts loopback IPv6 address', () => {
      expect(matchNetworks('::1', networks)).toBe(true);
    });

    it('accepts trusted IPv4 address', () => {
      expect(matchNetworks('10.0.0.1', networks)).toBe(true);
    });

    it('accepts trusted IPv6 address', () => {
      expect(matchNetworks('2001:db8::1', networks)).toBe(true);
    });

    it('rejects another IPv4 address', () => {
      expect(matchNetworks('192.0.2.1', networks)).toBe(false);
    });

    it('rejects another IPv6 address', () => {
      expect(matchNetworks('2001:db8:1::1', networks)).toBe(false);
    });
  });
});
