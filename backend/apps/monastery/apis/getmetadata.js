const fs = require("fs");
 
exports.doService = async jsonReq => {
  return JSON.stringify(_getMetadata());
}

function _getMetadata() {
    if(!fs.existsSync(`${APP_CONSTANTS.CONF_DIR}/metadata.json`))    fs.writeFileSync(`${APP_CONSTANTS.CONF_DIR}/metadata.json`, JSON.stringify({}));
    let filedata = fs.readFileSync(`${APP_CONSTANTS.CONF_DIR}/metadata.json`);
    return JSON.parse(filedata);
}


 

const validateRequest = jsonReq => jsonReq.metadata ? true : false;