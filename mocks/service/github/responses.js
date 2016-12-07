export function okayNewHookCreated(req, res) {
  res.status(201);
  // No response body implemented
  res.send();
}

export function errorNoAccountOrRepo(req, res) {
  res.status(404).send({
    message: 'Not Found'
  });
}

export function errorBadCredentials(req, res) {
  res.status(401).send({
    message: 'Bad Credentials'
  });
}

export function errorWebhookExists(req, res) {
  res.status(422).send({
    message: 'Validation Failed'
  });
}

export function okayAuthenticated(req, res) {
  res.status(200).send({
    access_token: 'e72e16c7e42f292c6912e7710c838347ae178b4a',
    scope: 'read:repo_hook',
    token_type: 'bearer'
  });
}
