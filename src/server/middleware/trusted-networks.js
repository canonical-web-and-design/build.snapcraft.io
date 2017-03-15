// Middleware to restrict a route to trusted networks.

import ipaddr from 'ipaddr.js';

import { conf } from '../helpers/config';

const rawNetworks = conf.get('TRUSTED_NETWORKS', '').split(',')
  .filter((ip) => ip);
const networks = rawNetworks.map((cidr) => ipaddr.parseCIDR(cidr));

const networksOfKind = (networks, kind) => {
  return networks.filter(([subnet]) => subnet.kind() === kind);
};

export const matchNetworks = (ip, networks) => {
  const addr = ipaddr.parse(ip);
  if (addr.range() === 'loopback') {
    return true;
  }
  return ipaddr.subnetMatch(addr, {
    trusted: networksOfKind(networks, addr.kind())
  }) === 'trusted';
};

export default (req, res, next) => {
  if (matchNetworks(req.ip, networks)) {
    next();
  } else {
    res.status(403).send(`IP address ${req.ip} not in trusted network.`);
  }
};
