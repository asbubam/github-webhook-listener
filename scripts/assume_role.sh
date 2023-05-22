#!/bin/bash

# Assume Role
CREDS=$(aws sts assume-role --role-arn arn:aws:iam::${TARGET_AWS_ACCOUNT_ID}:role/${ROLE_NAME_FOR_DEPLOY} --role-session-name github-webhook-listener-serverless)
RETURN_VAL=$?
if [ "$RETURN_VAL" -eq "0" ]; then
   KEYID=`      echo $CREDS | jq -r '.Credentials.AccessKeyId'`
   SECRETKEY=`  echo $CREDS | jq -r '.Credentials.SecretAccessKey'`
   TOKEN=`      echo $CREDS | jq -r '.Credentials.SessionToken'`

   export AWS_DEFAULT_REGION="ap-northeast-2"
   export AWS_ACCESS_KEY_ID=$KEYID
   export AWS_SECRET_ACCESS_KEY=$SECRETKEY
   export AWS_SESSION_TOKEN=$TOKEN
else
  echo "Failed to set credentials"
  exit 1
fi
