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
    if(!fs.existsSync(APP_CONSTANTS.XFORGE_META_DIR)) fs.mkdirSync(APP_CONSTANTS.XFORGE_META_DIR);
    if(!fs.existsSync(`${APP_CONSTANTS.XFORGE_META_DIR}/xforge.json`)){
        fs.writeFileSync(`${APP_CONSTANTS.XFORGE_META_DIR}/xforge.json`, JSON.stringify({}));
        _writeFile(jsonReq);
    } else {
        _writeFile(jsonReq);
    }
}
 

 function _writeFile(jsonReq){
    fs.writeFileSync(`${APP_CONSTANTS.XFORGE_META_DIR}/xforge.json`, JSON.stringify(jsonReq.metadata, null, 4));

 }

const validateRequest = jsonReq => jsonReq.metadata && jsonReq.org  && jsonReq.id && jsonReq.server && jsonReq.port ? true : false;