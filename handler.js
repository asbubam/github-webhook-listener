const crypto = require('crypto');
const request = require('request');

const signRequestBody = (key, body) => {
  return `sha1=${crypto.createHmac('sha1', key).update(body, 'utf-8').digest('hex')}`;
}

const whiteHostnameList = [
  '2dal.com',
];

const whiteOwnerList = [
  'GitHub Owner Name',
];

const whiteRepoList = [
  "asbubam/github-webhook-listener",
];

const isHostnameInWhiteList = (hostname) => {
  return !!whiteHostnameList.find((whiteHostname) => hostname.endsWith(whiteHostname));
}

const isOwnerInWhiteList = (org) => {
  return !!whiteOwnerList.find((whiteOwner) => org == whiteOwner);
}

const isRepoInWhiteList = (repo) => {
  return !!whiteRepoList.find((whiteRepo) => repo == whiteRepo);
}

module.exports.githubWebhookListener = (event, context, callback) => {
  let errMsg;
  const headers = event.headers;
  const sig = headers['X-Hub-Signature'];
  const githubEvent = headers['X-GitHub-Event'];
  const id = headers['X-GitHub-Delivery'];
  const contentType = headers['content-type'];
  const token = process.env.GITHUB_WEBHOOK_SECRET;

  const hookURL = event.queryStringParameters.hookURL;
  const hookURLObj = new URL(hookURL);
  const hookHost = hookURLObj.host;
  const hookHostname = hookURLObj.hostname;

  /*
  if (typeof token !== 'string') {
    errMsg = 'Must provide a \'GITHUB_WEBHOOK_SECRET\' env variable';
    return callback(null, {
      statusCode: 401,
      headers: { 'Content-Type': 'text/plain' },
      body: errMsg,
    });
  }

  if (!sig) {
    errMsg = 'No X-Hub-Signature found on request';
    return callback(null, {
      statusCode: 401,
      headers: { 'Content-Type': 'text/plain' },
      body: errMsg,
    });
  }
  */

  if (!hookURL || !hookHost) {
    errMsg = 'No hookURL/hookHost found on request';
    return callback(null, {
      statusCode: 422,
      headers: { 'Content-Type': 'text/plain' },
      body: errMsg,
    });
  }

  if (!githubEvent) {
    errMsg = 'No X-Github-Event found on request';
    return callback(null, {
      statusCode: 422,
      headers: { 'Content-Type': 'text/plain' },
      body: errMsg,
    });
  }

  if (!id) {
    errMsg = 'No X-Github-Delivery found on request';
    return callback(null, {
      statusCode: 401,
      headers: { 'Content-Type': 'text/plain' },
      body: errMsg,
    });
  }

  if (token && sig !== signRequestBody(token, event.body)) {
    errMsg = 'X-Hub-Signature incorrect. Github webhook token doesn\'t match';
    return callback(null, {
      statusCode: 401,
      headers: { 'Content-Type': 'text/plain' },
      body: errMsg,
    });
  }

  if (!isHostnameInWhiteList(hookHostname)) {
    errMsg = 'Host is not allowed to connect to this Gateway';
    return callback(null, {
      statusCode: 401,
      headers: { 'Content-Type': 'text/plain' },
      body: errMsg,
    });
  }

  /*
   * forward request(header & body) to hookURL
   */
  const decodedBody = decodeURIComponent(event.body);

  let payloadStr; 
  if (contentType == 'application/json') {
    payloadStr = decodedBody;
  } else {
    payloadStr = decodedBody.substring(decodedBody.indexOf('&payload=') + 9);
  }

  const payload = JSON.parse(payloadStr);
  const owner = payload.repository.owner;
  const repositoryFullName = payload.repository.full_name;

  if (!isOwnerInWhiteList(owner.login) && !isRepoInWhiteList(repositoryFullName)) {
    errMsg = 'This owner/repo is not allowed to connect to this Gateway';
    return callback(null, {
      statusCode: 401,
      headers: { 'Content-Type': 'text/plain' },
      body: errMsg,
    });
  }

  console.log(`Github-Event: "${githubEvent}" from: "${repositoryFullName}" to: "${hookURL}"`);

  // copy headers & change host
  const newHeaders = JSON.parse(JSON.stringify(headers));
  newHeaders.host = hookHost;

  const options = {
    uri: hookURL,
    method: 'POST',
    headers: newHeaders,
    body: event.body
  };

  request.post(options, (err, response, body) => {
    if (err) console.log('err: ' + err);

    return callback(err, {
      statusCode: response.statusCode,
      body: response.body,
    });
  });
};
