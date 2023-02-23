const fs = require("fs");
const {xforge} = require(`${APP_CONSTANTS.APP_ROOT}/3p/xforge/xforge`);


 
exports.doService = async jsonReq => {
    LOG.info("Running Scripts")
   if (!validateRequest(jsonReq)) { LOG.error(`Bad script or request`); return { result:false }; }
   else{
    const xforgeArgs = {
        colors: "ANKIT", 
        file: `${APP_CONSTANTS.APP_ROOT}/3p/xforge/samples/${jsonReq.name}.js`,
        other: [ ]
    }
    await xforge(xforgeArgs)

    // if (await xforge(xforgeArgs)==0) {
    //     if (await dbAbstractor.addHostToDB(params[1], params[0].toLowerCase(), params[2], newPassword, params[4])) return true;
    //     else {_showError(newPassword, params[2], params[3]); return false;}
    // } else {_showError(newPassword, params[2], params[3]); return false;}
   }
}




const validateRequest = jsonReq => jsonReq.name ? true : false;

