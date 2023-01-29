const fs = require("fs");
const userid = require(`${APP_CONSTANTS.LIB_DIR}/userid.js`);

 
exports.doService = async jsonReq => {
   if (!validateRequest(jsonReq)) { LOG.error(`Bad metadata or request`); return { result:false }; }
   else{
    const userslist = await userid.getUserMatchingOnOrg(jsonReq.org);
    if(userslist.result&&userslist.users.length>0){
    const result = userslist.users.some(user=>user.user_id == jsonReq.id &&user.role=="admin")
    _generateMetadata(jsonReq);
    return { result:result };
    }
    else return { result:false };
   }
}

function _generateMetadata(jsonReq) {
    if(!fs.existsSync(`${APP_CONSTANTS.CONF_DIR}/${jsonReq.org}.metadata.json`)){
        fs.writeFileSync(`${APP_CONSTANTS.CONF_DIR}/${jsonReq.org}.metadata.json`, JSON.stringify({}));
        _writeFile(jsonReq.metadata,jsonReq.org);
    } else {
        _writeFile(jsonReq.metadata,jsonReq.org);
    }
 }

 function _writeFile(metadata,org){
    fs.writeFileSync(`${APP_CONSTANTS.CONF_DIR}/${org}.metadata.json`, JSON.stringify(metadata, null, 4));

 }

const validateRequest = jsonReq => jsonReq.metadata && jsonReq.org && jsonReq.id ? true : false;