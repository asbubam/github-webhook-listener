#!/bin/bash

source ./scripts/assume_role.sh
serverless logs -f githubWebhookListener -t
