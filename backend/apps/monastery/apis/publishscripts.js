const fs = require("fs");
const userid = require(`${APP_CONSTANTS.LIB_DIR}/userid.js`);

 
exports.doService = async jsonReq => {
   if (!validateRequest(jsonReq)) { LOG.error(`Bad scripts or request`); return { result:false }; }
   else{
    const userslist = await userid.getUserMatchingOnOrg(jsonReq.org);
    if(userslist.result&&userslist.users.length>0){
    const result = userslist.users.some(user=>user.user_id == jsonReq.id &&user.role=="admin")
    _generateScripts(jsonReq);
    return { result:result };
    }
    else return { result:false };
   }
}

function _generateScripts(jsonReq) {
    if(!fs.existsSync(APP_CONSTANTS.XFORGE_SCRIPTS_DIR)) fs.mkdirSync(APP_CONSTANTS.XFORGE_SCRIPTS_DIR);
    const name = jsonReq.name;
	const script = Buffer.from(jsonReq.data, "base64").toString();
	const modulePath = APP_CONSTANTS.XFORGE_SCRIPTS_DIR+"/"+name+".js";
    fs.writeFileSync(modulePath,script);

}


const validateRequest = jsonReq => jsonReq.data && jsonReq.org  && jsonReq.id && jsonReq.server && jsonReq.port && jsonReq.name ? true : false;