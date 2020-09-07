export const MddsFileCrop = 'mdds-file-crop';
const path = { sep: '/' };

export const getDownloadUrl = function (url: string, isLarge: boolean): string {
  let downloadUrl = url;
  if (url && !url.startsWith('data:')) {
    // a real url
    downloadUrl = isLarge ? downloadUrl : `${downloadUrl}_thumbnail`;
  }
  return downloadUrl;
};

// IMPORTANT: don't change this. Sync with the express-file-server implementation only.
export const processDownloadUrl = function (url: string): any {
    let thumbnail = false;
    let link = url;
    if (link.endsWith('_thumbnail')) {
      link = link.replace(/_thumbnail$/, '');
      thumbnail = true;
    }
  
    let filePath = link.substring(
      link.indexOf('/download/') + '/download/'.length
    );
    let fileCategory = 'picture';
  
    function getID(originalFileName) {
      let pos = originalFileName.indexOf('__');
      let uploadFileName = pos >=0 ? originalFileName.substring(pos+2) : originalFileName;
  
      let idPart = originalFileName.split('__')[0]; // get the ID Part
      let id = idPart;
      let croppedImage = false;
      if (
        originalFileName.startsWith(MddsFileCrop) ||
        originalFileName.includes('-cr')
      ) {
        croppedImage = true;
        // remove the crop part from idPart
        id = idPart.replace(`${MddsFileCrop}-`, '').replace(/-cr.*/, '');
      }
  
      return [croppedImage, id, uploadFileName];
    }
  
    if (!filePath.includes('/')) {
      // legacy picture
      // fileName = filePath
      let fileName = decodeURI(filePath);
      let [croppedImage, id, uploadFileName] = getID(fileName);
      return {
        id,
        croppedImage,
        thumbnail,
        fileCategory,
        fileSubDir: '',
        fileName,
        uploadFileName,
      };
    }
  
    let lastSepPos = filePath.lastIndexOf('/');
    let fileDir = filePath.substring(0, lastSepPos);
    let fileSubDir = fileDir.split('/').join(path.sep);
    let fileName = decodeURI(filePath.substring(lastSepPos + 1));
    let [croppedImage, id, uploadFileName] = getID(fileName);
  
    if (fileDir.startsWith('users')) {
      // users/<id/[file|picture]
      fileCategory = fileDir.split('/')[2];
    } else if (fileDir.startsWith('picture')) {
      fileCategory = 'picture';
    } else if (fileDir.startsWith('file')) {
      fileCategory = 'file';
    }
  
    return {
      id,
      croppedImage,
      thumbnail,
      fileCategory,
      fileSubDir,
      fileName,
      uploadFileName,
    };
  };