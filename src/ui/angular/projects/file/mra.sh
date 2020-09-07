TARGET_DIR="./src"

OUTPUT_DIR="${TARGET_DIR}/tmpoutout"

rm -rf ${OUTPUT_DIR}
mkdir -p ${OUTPUT_DIR}

OUTPUT_DIR_FILE="${OUTPUT_DIR}/file"
TARGET_DIR_FILE="${TARGET_DIR}/file"

~/dev/mean-rest/src/dev/angular-cli/bin/mra.js -m file -v public -o ${OUTPUT_DIR} src/models/sample.admin.js

files=(
  "/mpicturegroup/mpicturegroup.service.ts"
  "/mpicturegroup/mpicturegroup.component.ts"
  "/mpicturegroup/mpicturegroup.base.service.ts"
  "/mpicturegroup/mpicturegroup-list/mpicturegroup-list-view.component.ts"
  "/mpicturegroup/mpicturegroup-list/mpicturegroup-list-select.component.css"
  "/mpicturegroup/mpicturegroup-list/mpicturegroup-list-select.component.html"
  "/mpicturegroup/mpicturegroup-list/mpicturegroup-list-select.component.ts"
  "/mpicturegroup/mpicturegroup-list/mpicturegroup-list-view-widget-index.component.css"
  "/mpicturegroup/mpicturegroup-list/mpicturegroup-list-view-widget-index.component.html"
  "/mpicturegroup/mpicturegroup-list/mpicturegroup-list-view-widget-index.component.ts"
  "/mpicturegroup/mpicturegroup-list/mpicturegroup-list.component.ts"
  "/mpicturegroup/mpicturegroup-list/mpicturegroup-list.component.css"
  "/mpicturegroup/mpicturegroup-edit/mpicturegroup-edit.component.css"
  "/mpicturegroup/mpicturegroup-edit/mpicturegroup-edit.component.html"
  "/mpicturegroup/mpicturegroup-edit/mpicturegroup-edit.component.ts"
  "/mpicture/mpicture.service.ts"
  "/mpicture/mpicture.component.ts"
  "/mpicture/mpicture.base.service.ts"
  "/mpicture/mpicture-list/mpicture-list-general.component.html"
  "/mpicture/mpicture-list/mpicture-list-general.component.css"
  "/mpicture/mpicture-list/mpicture-list-general.component.ts"
  "/mpicture/mpicture-list/mpicture-list-view.component.ts"
  "/mpicture/mpicture-list/mpicture-list-view-widget-gallery-bottom-title.component.html"
  "/mpicture/mpicture-list/mpicture-list-view-widget-gallery-bottom-title.component.css"
  "/mpicture/mpicture-list/mpicture-list-view-widget-gallery-bottom-title.component.ts"
  "/mpicture/mpicture-list/mpicture-list.component.ts"
  "/mpicture/mpicture-list/mpicture-list.component.css"
)

mkdir -p ${TARGET_DIR_FILE}/mpicture
mkdir -p ${TARGET_DIR_FILE}/mpicture/mpicture-list
mkdir -p ${TARGET_DIR_FILE}/mpicturegroup
mkdir -p ${TARGET_DIR_FILE}/mpicturegroup/mpicturegroup-list
mkdir -p ${TARGET_DIR_FILE}/mpicturegroup/mpicturegroup-edit

for fl in "${files[@]}"
do
    cp "${OUTPUT_DIR_FILE}${fl}" "${TARGET_DIR_FILE}${fl}"
done
mkdir -p ${TARGET_DIR}/file-cust
rm -rf ${TARGET_DIR}/file-cust/base
cp -r ${OUTPUT_DIR}/file-cust/base ${TARGET_DIR}/file-cust
rm -rf ${TARGET_DIR}/file-cust/mfile/
rm -rf ${TARGET_DIR}/file-cust/mfilegroup/
rm -rf ${OUTPUT_DIR}

sed -i '' 's/File_SERVER_ROOT_URI/FILE_MANAGE_ROOT_URI/g' ${TARGET_DIR_FILE}/mpicturegroup/mpicturegroup.service.ts
sed -i '' 's/file.tokens/tokens/g' ${TARGET_DIR_FILE}/mpicturegroup/mpicturegroup.service.ts
sed -i '' 's/File_SERVER_ROOT_URI/FILE_MANAGE_ROOT_URI/g' ${TARGET_DIR_FILE}/mpicture/mpicture.service.ts
sed -i '' 's/file.tokens/tokens/g' ${TARGET_DIR_FILE}/mpicture/mpicture.service.ts
sed -i '' 's/file.component/file.select.directive/g' ${TARGET_DIR_FILE}/mpicture/mpicture.component.ts

echo "Update select picture view:"
echo "  1. Go to ${TARGET_DIR_FILE}/mpicture/mpicture-list/mpicture-list-general.component.html"
echo "     Copy the main part"
echo "  2. Go to ${TARGET_DIR_FILE}/cust/mpicture-list-widget.component.html"
echo "     Replace <!--1.2.2 Start of gallery widget-->"