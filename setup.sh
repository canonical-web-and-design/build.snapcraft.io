#! /usr/bin/env bash

# Helper script for setting up OAuth environment
# ===
#
# This will usually be run through the ./run script,
# using the canonicalwebteam/dev docker image:
# https://hub.docker.com/r/canonicalwebteam/dev/
#
# Once the setup script has finished, the web application
# will then be run in a container from the same
# Docker image on port 8083, and this will also be published
# on port 8083 on the host. So the application can then be
# accessed at:
# http://0.0.0.0:8083


# Bash strict mode
set -euo pipefail

cat <<EOF
##########################
#                        #
#         GitHub         #
#                        #
##########################
You need to register a new OAuth application:
https://github.com/settings/applications/new

You can enter these parameters:
* Application name: BSI development
* Homepage URL: 0.0.0.0:8083
* Application description: This is a development OAuth application for build.snapcraft.io
* Authorization callback URL: http://0.0.0.0:8083/auth/verify
EOF

echo "Press any key to continue"
read

echo
read -p "Enter the GitHub client id: " client_id
read -p "Enter the GitHub client secret: " client_secret
read -p "Enter GitHub Username: " username
read -s -p "Enter GitHub Password: " password
echo
read -p "Enter GitHub 2FA: " tfa

user="$username:$password"
content_type="Content-Type: application/json"
otp="X-GitHub-OTP: $tfa"
data="{
  \"client_id\": \"${client_id}\",
  \"client_secret\": \"${client_secret}\",
  \"note\": \"build.snapcraft.io poller token\"
}"

token=$(curl -X POST \
     https://api.github.com/authorizations \
     -u "$user" \
     -H "$content_type" \
     -H "$otp" \
     -d "$data" | jq '.token' -r)

echo "GITHUB_API_ENDPOINT=https://api.github.com" > .env.local
echo "GITHUB_AUTH_LOGIN_URL=https://github.com/login/oauth/authorize" >> .env.local
echo "GITHUB_AUTH_VERIFY_URL=https://github.com/login/oauth/access_token" >> .env.local
echo "GITHUB_AUTH_REDIRECT_URL=http://0.0.0.0:8083/auth/verify" >> .env.local
echo "GITHUB_AUTH_CLIENT_ID=$client_id" >> .env.local
echo "GITHUB_AUTH_CLIENT_SECRET=$client_secret" >> .env.local
echo "GITHUB_AUTH_CLIENT_TOKEN=$token" >> .env.local

cat <<EOF
##########################
#                        #
#       Launchpad        #
#                        #
##########################
EOF
./scripts/create-launchpad-credentials

chmod 600 .env.local

cat <<EOF

You can run the project by running this command:
    ./run

EOF
