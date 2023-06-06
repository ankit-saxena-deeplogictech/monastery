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
    if(jsonReq.isPublicServer) {
    if(!fs.existsSync(APP_CONSTANTS.META_DIR)) fs.mkdirSync(APP_CONSTANTS.META_DIR);
    if(!fs.existsSync(`${APP_CONSTANTS.META_DIR}/public`)) fs.mkdirSync(`${APP_CONSTANTS.META_DIR}/public`)
    if(!fs.existsSync(`${APP_CONSTANTS.META_DIR}/public/${jsonReq.org}`)) fs.mkdirSync(`${APP_CONSTANTS.META_DIR}/public/${jsonReq.org}`)
    if(!fs.existsSync(`${APP_CONSTANTS.META_DIR}/public/${jsonReq.org}/${jsonReq.name}_${jsonReq.server}_${jsonReq.port}.json`)){
        fs.writeFileSync(`${APP_CONSTANTS.META_DIR}/public/${jsonReq.org}/${jsonReq.name}_${jsonReq.server}_${jsonReq.port}.json`, JSON.stringify({}));
        _writeFile(jsonReq);
    } else {
        _writeFile(jsonReq);
    }
    }
    else {
        if(!fs.existsSync(APP_CONSTANTS.META_DIR)) fs.mkdirSync(APP_CONSTANTS.META_DIR);
        if(!fs.existsSync(`${APP_CONSTANTS.META_DIR}/${jsonReq.org}`)) fs.mkdirSync(`${APP_CONSTANTS.META_DIR}/${jsonReq.org}`)
        if(!fs.existsSync(`${APP_CONSTANTS.META_DIR}/${jsonReq.org}/${jsonReq.name}_${jsonReq.server}_${jsonReq.port}.json`)){
        fs.writeFileSync(`${APP_CONSTANTS.META_DIR}/${jsonReq.org}/${jsonReq.name}_${jsonReq.server}_${jsonReq.port}.json`, JSON.stringify({}));
        _writeFile(jsonReq);
    } else {
        _writeFile(jsonReq);
    }
    }
}
 

 function _writeFile(jsonReq){
    if(jsonReq.isPublicServer){
        fs.writeFileSync(`${APP_CONSTANTS.META_DIR}/public/${jsonReq.org}/${jsonReq.name}_${jsonReq.server}_${jsonReq.port}.json`, JSON.stringify(jsonReq.metadata, null, 4));
    } else {
        fs.writeFileSync(`${APP_CONSTANTS.META_DIR}/${jsonReq.org}/${jsonReq.name}_${jsonReq.server}_${jsonReq.port}.json`, JSON.stringify(jsonReq.metadata, null, 4));
    }

 }

const validateRequest = jsonReq => jsonReq.metadata && jsonReq.org && jsonReq.name && jsonReq.id &&jsonReq.server && jsonReq.port? true : false;