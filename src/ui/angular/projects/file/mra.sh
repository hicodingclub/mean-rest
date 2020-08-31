TARGET_DIR="./src"

OUTPUT_DIR="${TARGET_DIR}/tmpoutout"
mkdir -p ${OUTPUT_DIR}
OUTPUT_DIR_FILE="${OUTPUT_DIR}/file"
TARGET_DIR_FILE="${TARGET_DIR}/file"

~/dev/mean-rest/src/dev/angular-cli/bin/mra.js -m file -v public -o ${OUTPUT_DIR} src/models/sample.admin.js

files=(
  "/mfilegroup/mfilegroup.service.ts"
  "/mfilegroup/mfilegroup.component.ts"
  "/mfilegroup/mfilegroup.base.service.ts"
  "/mfilegroup/mfilegroup-list/mfilegroup-list-view.component.ts"
  "/mfilegroup/mfilegroup-list/mfilegroup-list-select.component.css"
  "/mfilegroup/mfilegroup-list/mfilegroup-list-select.component.html"
  "/mfilegroup/mfilegroup-list/mfilegroup-list-select.component.ts"
  "/mfilegroup/mfilegroup-list/mfilegroup-list-view-widget-index.component.css"
  "/mfilegroup/mfilegroup-list/mfilegroup-list-view-widget-index.component.html"
  "/mfilegroup/mfilegroup-list/mfilegroup-list-view-widget-index.component.ts"
  "/mfilegroup/mfilegroup-list/mfilegroup-list.component.ts"
  "/mfilegroup/mfilegroup-list/mfilegroup-list.component.css"
  "/mfilegroup/mfilegroup-edit/mfilegroup-edit.component.css"
  "/mfilegroup/mfilegroup-edit/mfilegroup-edit.component.html"
  "/mfilegroup/mfilegroup-edit/mfilegroup-edit.component.ts"
  "/mfile/mfile.service.ts"
  "/mfile/mfile.component.ts"
  "/mfile/mfile.base.service.ts"
  "/mfile/mfile-list/mfile-list-general.component.html"
  "/mfile/mfile-list/mfile-list-general.component.css"
  "/mfile/mfile-list/mfile-list-general.component.ts"
  "/mfile/mfile-list/mfile-list-view.component.ts"
  "/mfile/mfile-list/mfile-list-view-widget-gallery-bottom-title.component.html"
  "/mfile/mfile-list/mfile-list-view-widget-gallery-bottom-title.component.css"
  "/mfile/mfile-list/mfile-list-view-widget-gallery-bottom-title.component.ts"
  "/mfile/mfile-list/mfile-list.component.ts"
  "/mfile/mfile-list/mfile-list.component.css"
)

for fl in "${files[@]}"
do
    cp "${OUTPUT_DIR_FILE}${fl}" "${TARGET_DIR_FILE}${fl}"
done
mkdir -p ${TARGET_DIR}/file-cust
rm -rf ${TARGET_DIR}/file-cust/base
cp -r ${OUTPUT_DIR}/file-cust/base ${TARGET_DIR}/file-cust
rm -rf ${OUTPUT_DIR}

sed -i '' 's/File_SERVER_ROOT_URI/FILE_MANAGE_ROOT_URI/g' ${TARGET_DIR_FILE}/mfilegroup/mfilegroup.service.ts
sed -i '' 's/file.tokens/tokens/g' ${TARGET_DIR_FILE}/mfilegroup/mfilegroup.service.ts
sed -i '' 's/File_SERVER_ROOT_URI/FILE_MANAGE_ROOT_URI/g' ${TARGET_DIR_FILE}//mfile/mfile.service.ts
sed -i '' 's/file.tokens/tokens/g' ${TARGET_DIR_FILE}//mfile/mfile.service.ts
sed -i '' 's/file.component/file.select.directive/g' ${TARGET_DIR_FILE}//mfile/mfile.component.ts

echo "Update select picture view:"
echo "  1. Go to ${TARGET_DIR_FILE}/mfile/mfile-list/mfile-list-general.component.html"
echo "     Copy the main part"
echo "  2. Go to ${TARGET_DIR_FILE}/mfile/mfile-list/mfile-list-widget.component.html"
echo "     Replace <!--1.2.2 Start of gallery widget-->"