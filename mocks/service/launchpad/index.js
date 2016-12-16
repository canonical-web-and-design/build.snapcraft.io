import { Router } from 'express';

const router = Router();

router.post('/+snaps', (req, res) => {
  const base = `${req.protocol}://${req.hostname}${req.baseUrl}`;
  if (req.query['ws.op'] == 'new') {
    const owner = req.query.owner.replace(/^\/+/, '');
    res.status(201).send({
      resource_type_link: `${base}/#snap`,
      self_link: `${base}/${owner}/+snap/${req.query.name}`
    });
  } else {
    res.status(400).send(`No such operation: ${req.query['ws.op']}`);
  }
});

router.post('/~:owner/+snap/:name', (req, res) => {
  const base = `${req.protocol}://${req.hostname}${req.baseUrl}`;
  if (req.query['ws.op'] == 'beginAuthorization') {
    res.status(200).json(`${base}${req.url}/+authorize/+login`);
  } else {
    res.status(400).send(`No such operation: ${req.query['ws.op']}`);
  }
});

export default router;
