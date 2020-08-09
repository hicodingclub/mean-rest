const deleteFile = function(data, restController) {
    const fileController = restController.mddsProperties['fileController'];
    if (!fileController) {
        console.error('fileController does not exist in restController');
        return;
    };
    if (data && data._id) {
        fileController.DeleteById(data._id, data.hasThumbnail);
    }
}

const hooks = {
    insert: [],
    update: [],
    delete: [deleteFile,],
}

module.exports = {
    hooks,
}