const fs = require("fs");
 
exports.doService = async jsonReq => {
   if (!validateRequest(jsonReq)) { LOG.error(`Bad metadata.`); return { result:false }; }
   else{
    _generateMetadata(jsonReq);
    return { result:true };
   }
}

function _generateMetadata(jsonReq) {
    if(!fs.existsSync(`${APP_CONSTANTS.CONF_DIR}/metadata.json`)){
        fs.writeFileSync(`${APP_CONSTANTS.CONF_DIR}/metadata.json`, JSON.stringify({}));
        _writeFile(jsonReq.metadata);
    } else {
        _writeFile(jsonReq.metadata);
    }
 }

 function _writeFile(metadata){
    fs.writeFileSync(`${APP_CONSTANTS.CONF_DIR}/metadata.json`, JSON.stringify(metadata, null, 4));

 }

const validateRequest = jsonReq => jsonReq.metadata ? true : false;