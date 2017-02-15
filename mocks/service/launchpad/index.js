import { Router } from 'express';

const router = Router();

router.post('/\\+snaps', (req, res) => {
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

router.get('/devel/\\+snaps', (req, res) => {
  const base = `${req.protocol}://${req.hostname}${req.baseUrl}`;
  if (req.query['ws.op'] == 'findByURLPrefix') {
    const owner = req.query.owner.replace(/^\/+/, '');
    const prefix = req.query.url_prefix;
    res.status(200).send({
      total_size: 2,
      start: 0,
      entries: [
        {
          resource_type_link: `${base}/#snap`,
          git_repository_url: `${prefix}mock-repo-1`,
          self_link: `${base}/${owner}/+snap/mock-snap-1`
        },
        {
          resource_type_link: `${base}/#snap`,
          git_repository_url: `${prefix}mock-repo-2`,
          self_link: `${base}/${owner}/+snap/mock-snap-1`
        }
      ]
    });
  } else {
    res.status(400).send(`No such operation: ${req.query['ws.op']}`);
  }
});

router.post('/~:owner/\\+snap/:name', (req, res) => {
  if (req.query['ws.op'] == 'completeAuthorization') {
    res.status(200).json(null);
  } else {
    res.status(400).send(`No such operation: ${req.query['ws.op']}`);
  }
});

export default router;
