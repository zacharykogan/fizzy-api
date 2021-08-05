#!/bin/bash

API="http://localhost:4741"
URL_PATH="/examples"

curl "${API}${URL_PATH}/${ID}" \
  --include \
  --request DELETE \
  --header "Authorization: Bearer ${TOKEN}"

echo


# //
# Request:

# ```sh
# curl --include --request DELETE http://localhost:4741/sign-out/ \