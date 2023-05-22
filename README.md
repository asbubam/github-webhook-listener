# github-webhook-listener

This project using [serverless](https://serverless.com/) framework.  

fork from https://github.com/serverless/examples/tree/master/aws-node-github-webhook-listener

## define env variables
```bash
export TARGET_AWS_ACCOUNT_ID=xxx
# optional
export GITHUB_WEBHOOK_SECRET=xxx

export VPC_SG_ID=sg-xxx
export VPC_SUBNET_A_ID=xxx
export VPC_SUBNET_C_ID=xxx

export CUSTOM_DOMAIN=xxx
```

## create custom domain for API gateway
```bash
$ npm run create_domain
```

## deploy to AWS lambda & api gateway
```bash
$ npm run deploy

# with serverless debug
$ SLS_DEBUG=* npm run deploy
```

## check logs
```bash
$ npm run logs
```

## delete custom domain for API gateway
```bash
$ npm run delete_domain
```

## remove from AWS lambda & api gateway
```bash
$ npm run remove
```

## Apply GitHub webhook ips for resource policy of AWS API Gateway

* check GitHub hooks ip address
```bash
$ curl https://api.github.com/meta
...
  "hooks": [
    "192.30.252.0/22",
    "185.199.108.0/22",
    "140.82.112.0/20"
  ],
...
```

* add resourcePolicy to serverless.yaml file
```yaml
provider:
  resourcePolicy:
    - Effect: Allow
      Principal: "*"
      Action: execute-api:Invoke
      Resource:
        - execute-api:/*/*/*
      Condition:
        IpAddress:
          aws:SourceIp:
            - "192.30.252.0/22"
            - "185.199.108.0/22"
            - "140.82.112.0/20"
```

