#!/bin/sh

check="N"
install="N"
publish="N"
build="N"

POSITIONAL=()
while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    -c|--check)
    check="Y"
    shift # past value
    ;;
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

if [ $check != "Y" ] && [ "$#" -ne 1 ]; then
  echo "Usage: $0 -c|--check -i|--install -b|--build -p|--publish VERSION" >&2
  exit 1
fi

delay=6
if [ $check = "Y" ];then
  echo "Check the existing versions..."
  delay=1 
else
  VERSION=$1
  echo "Upgrade to VERSION $VERSION..."
fi

BASEDIR=$PWD

packages=(
  "/dev/angular-cli"
  "/dev/cli"
  "/node.js/express/core" 
  "/node.js/express/emailing"
  "/node.js/express/auth-app"
  "/node.js/express/auth-server"
  "/node.js/express/file-server"
)

ANDROIDDIR="/ui/angular"
ANDROIDPROJECT="$ANDROIDDIR/projects"
ANDROIDDIST="$ANDROIDDIR/dist"

#Package name and angular subfolder pairs
angular_libs=(
  "Auth auth"
  "RichText richtext"
  "ActionBase action-base"
  "ActionEmail action-email"
  "Core core"
  "File file"
  "Composite composite"
  "ShoppingFramework shopping-framework"
  "ShoppingCart shopping-cart"
)

dependencies=(
  "@hicoder\/angular-core"
  "@hicoder\/angular-cli"
  "@hicoder\/angular-composite"
  "@hicoder\/angular-auth"
  "@hicoder\/angular-file"
  "@hicoder\/angular-action-base"
  "@hicoder\/angular-action-email"
  "@hicoder\/angular-richtext"
  "@hicoder\/angular-shopping-framework"
  "@hicoder\/angular-shopping-cart"
  "@hicoder\/express-auth-app"
  "@hicoder\/express-emailing"
  "@hicoder\/express-auth-server"
  "@hicoder\/express-file-server"
  "@hicoder\/express-core"
  "@hicoder\/cli"
)


replacePackages()
{
  dir=$1
  cd $dir
  sed -i '' -e "s/\"version\":[[:space:]]*\".*\"/\"version\": \"$VERSION\"/g" package.json
      
  for dependent in "${dependencies[@]}"
  do
    sed -i '' -e "s/\"$dependent\":[[:space:]]*\".*\"/\"$dependent\": \"$VERSION\"/g" package.json
  done
  if [ $install = "Y" ];then
    rm -rf node_modules
    npm install
  fi
}
printPackageVer()
{
  dir=$1
  cd $dir
  sed -n -e "/\"version\":[[:space:]]*\".*\"/p" package.json
}


number=0
for element in "${packages[@]}"
do
    number=$(($number+1))
    echo "=========$number: Processing $element ..."

    sleep $delay

    DIR=$BASEDIR/$element
    if ! [ -d $DIR ]; then
      echo "Error: Directory $DIR doesn't exist."
    else
      if [ $check = "Y" ];then
        printPackageVer $DIR
      else
        replacePackages $DIR
        if [ $publish = "Y" ];then
          npm publish --access=public
        fi
      fi 
    fi
done

for element in "${angular_libs[@]}"
do
    number=$(($number+1))
    echo "=========$number: Processing Android lib $element ..."
    IFS=' '
    read -a names <<< "$element"
    libName=${names[0]}
    dirName=${names[1]}

    DIR=$BASEDIR/$ANDROIDPROJECT/$dirName
    DISTDIR=$BASEDIR/$ANDROIDDIST/$dirName
    if ! [ -d $DIR ]; then
      echo "Error: Directory $DIR doesn't exist."
    else
      if [ $check = "Y" ];then
        printPackageVer $DIR
      else
        replacePackages $DIR;
        if [ $install = "Y" ];then
          cd $DIR
          rm -rf node_modules
          npm install
        fi

        if [ $build = "Y" ] || [ $publish = "Y" ];then
          cd $BASEDIR/$ANDROIDDIR
          ng build $libName --prod
        fi

        if [ $publish = "Y" ];then
          cd $BASEDIR
          cd $DISTDIR
          npm publish --access=public
        fi
      fi
    fi
done
