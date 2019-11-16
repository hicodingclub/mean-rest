#!/bin/sh


install="N"
publish="N"
build="N"

POSITIONAL=()
while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    -i|--install)
    install="Y"
    shift # past value
    ;;
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
  echo "Usage: $0 -i|--install -b|--build -p|--publish VERSION" >&2
  exit 1
fi

VERSION=$1
echo "Upgrade to VERSION $VERSION..."
BASEDIR=$PWD

packages=(
  "/ui/angular/cli"
  "/ui/angular/auth"
  "/ui/angular/file"
  "/ui/angular/summernote"
  "/ui/angular/action-base"
  "/ui/angular/action-email"
  "/ui/angular/core"
  "/ui/angular/composite"
  "/node.js/express/core" 
  "/node.js/express/emailing"
  "/node.js/express/auth-app"
  "/node.js/express/auth-server"
  "/node.js/express/file-server"
)

dependencies=(
  "@hicoder\/angular-core"
  "@hicoder\/angular-cli"
  "@hicoder\/angular-composite"
  "@hicoder\/angular-auth"
  "@hicoder\/angular-file"
  "@hicoder\/angular-action-base"
  "@hicoder\/angular-action-email"
  "@hicoder\/angular-summernote"
  "@hicoder\/express-auth-app"
  "@hicoder\/express-emailing"
  "@hicoder\/express-auth-server"
  "@hicoder\/express-file-server"
  "@hicoder\/express-core"
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

      if [ $install = "Y" ];then
        rm -rf node_modules
        npm install
      fi

      if grep -q "@angular" package.json; then
        echo "	This is an angular package."
        if [ $build = "Y" ] || [ $publish = "Y" ];then
          npm run package
        fi
        if [ $publish = "Y" ];then
          cd dist
          npm publish --access=public
        fi
      else
        if [ $publish = "Y" ];then
          npm publish --access=public
        fi
      fi
    fi
done
