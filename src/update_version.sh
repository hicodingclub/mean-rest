#!/bin/sh


publish="N"
build="N"

POSITIONAL=()
while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    -p|--publish)
    publish="Y"
    shift # past value
    ;;
    -b|--build)
    build="Y"
    shift # past value
    ;;
    *)    # unknown option
    POSITIONAL+=("$1") # save it in an array for later
    shift # past argument
    ;;
esac
done
set -- "${POSITIONAL[@]}"

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 -b|--build -p|--publish VERSION" >&2
  exit 1
fi

VERSION=$1
echo "Upgrade to VERSION $VERSION..."
BASEDIR=$PWD

packages=(
  "/mean-rest-express" 
  "/mean-rest-angular"
  "/mean-rest-angular-cli"
  "/web/angular/angular-composite"
  "/web/angular/cmn-angular-auth"
  "/web/angular/cmn-angular-file"
  "/web/angular/angular-action-base"
  "/web/angular/angular-action-email"
  "/node.js/common/mdds-emailing"
  "/node.js/express/auth-app"
  "/node.js/express/mgs-auth-svr"
  "/node.js/express/mgs-file-svr"
)

dependencies=(
  "mean-rest-angular"
  "mean-rest-angular-cli"
  "mdds-angular-composite"
  "mdds-angular-auth"
  "mdds-angular-file"
  "mdds-angular-action-base"
  "mdds-angular-action-email"
  "mdds-express-auth-app"
  "mdds-emailing"
  "mdds-mongoose-express-auth-server"
  "mdds-mongoose-express-file-server"
  "mean-rest-express"
);

number=0
for element in "${packages[@]}"
do
    number=$(($number+1))
    echo "=========$number: Processing $element ..."
    DIR=$BASEDIR/$element
    if ! [ -d $DIR ]; then
      echo "Error: Directory $DIR doesn't exist."
    else
      cd $BASEDIR/$element
      sed -i '' -e "s/\"version\":[[:space:]]*\".*\"/\"version\": \"$VERSION\"/g" package.json

      for dependent in "${dependencies[@]}"
      do
        sed -i '' -e "s/\"$dependent\":[[:space:]]*\".*\"/\"$dependent\": \"$VERSION\"/g" package.json
      done

      if grep -q "@angular" package.json; then
        echo "	This is an angular package."
        if [ $build = "Y" ] || [ $publish = "Y" ];then
          npm run package
        fi
        if [ $publish = "Y" ];then
          cd dist
          npm publish
        fi
      else
        if [ $publish = "Y" ];then
          npm publish
        fi
      fi
    fi
done
