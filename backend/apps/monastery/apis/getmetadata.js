const fs = require("fs");
const userid = require(`${APP_CONSTANTS.LIB_DIR}/userid.js`);

exports.doService = async jsonReq => {
  if (!validateRequest(jsonReq)) { LOG.error(`Bad Request`); return { result: false }; }
  else {
    const userslist = await userid.getUserMatchingOnOrg(jsonReq.org);
    if (userslist.result && userslist.users.length > 0) {
      const result = userslist.users.some(user => user.user_id == jsonReq.id);
      if (result) return  { result: true, data: _getMetadata(jsonReq.org) }
      else return { result: false };

    }
    else return { result: false };
  }
}

function _getMetadata(org) {
  if (!fs.existsSync(`${APP_CONSTANTS.CONF_DIR}/${org}.metadata.json`)) fs.writeFileSync(`${APP_CONSTANTS.CONF_DIR}/${org}.metadata.json`, JSON.stringify({}));
  let filedata = fs.readFileSync(`${APP_CONSTANTS.CONF_DIR}/${org}.metadata.json`);
  return JSON.parse(filedata);
}




const validateRequest = jsonReq => jsonReq.org && jsonReq.id ? true : false;