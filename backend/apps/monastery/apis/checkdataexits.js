const fs = require("fs");
const userid = require(`${APP_CONSTANTS.LIB_DIR}/userid.js`);

exports.doService = async jsonReq => {
  if (!validateRequest(jsonReq)) { LOG.error(`Bad Request`); return { result: false }; }
  else {
    const userslist = await userid.getUserMatchingOnOrg(jsonReq.org);
    if (userslist.result && userslist.users.length > 0) {
      const result = userslist.users.some(user => user.user_id == jsonReq.id);
        if(!fs.existsSync(`${APP_CONSTANTS.META_DIR}/${jsonReq.org}/${jsonReq.name}_${jsonReq.server}_${jsonReq.port}.json`)) return { result: false }
        // if(!fs.existsSync(`${APP_CONSTANTS.META_DIR}/public/${jsonReq.org}/${jsonReq.name}_${jsonReq.server}_${jsonReq.port}.json`)) return { result: false }
      else return { result: result };

    }
    else return { result: false };
  }
}



const validateRequest = jsonReq => jsonReq.org && jsonReq.id && jsonReq.name;