import { Router } from 'express';

// UNCOMMENT DESIRED RESPONSE
const response = 'okay-new-hook-created';
// const response = 'error-no-account-or-repo';
// const response = 'error-bad-credentials';
// const response = 'error-webhook-exists';

const router = Router();

const responses = {};

responses['okay-new-hook-created'] = (req, res) => {
  res.status(201);
  // No response body implemented
  res.send();
};

responses['error-no-account-or-repo'] = (req, res) => {
  res.status(404).send({
    message: 'Not Found'
  });
};

responses['error-bad-credentials'] = (req, res) => {
  res.status(401).send({
    message: 'Bad Credentials'
  });
};

responses['error-webhook-exists'] = (req, res) => {
  res.status(422).send({
    message: 'Validation Failed'
  });
};

router.post('/repos/:account/:repo/hooks', responses[response]);

export default router;
