const fs = require("fs");
const {xforge} = require(`${APP_CONSTANTS.APP_ROOT}/3p/xforge/xforge`);


 
exports.doService = async jsonReq => {
   if (!validateRequest(jsonReq)) { LOG.error(`Bad script or request`); return { result:false }; }
   else{
    const xforgeArgs = {
        colors: "ANKIT", 
        file: `${APP_CONSTANTS.APP_ROOT}/3p/xforge/samples/${jsonReq.name}.js`,
        other: [ ]
    }
  const result =  await xforge(xforgeArgs);
  if(result == 0)  return {result:true};
  else return {result:false}
   }
}




const validateRequest = jsonReq => jsonReq.name ? true : false;

