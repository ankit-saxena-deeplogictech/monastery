/**
 * Login listener to inject Monastery data into logins.
 * (C) 2023 TekMonks. All rights reserved.
 */

const login = require(`${LOGINAPP_CONSTANTS.API_DIR}/login.js`);
const register = require(`${LOGINAPP_CONSTANTS.API_DIR}/register.js`);
const MONASTERY_CONSTANTS = LOGINAPP_CONSTANTS.ENV.MONASTERYAPP_CONSTANTS;
const dblayer = require(`${MONASTERY_CONSTANTS.LIBDIR}/dblayer.js`);

exports.init = _ => {
    dblayer.initDB(); 

    login.addLoginListener(`${MONASTERY_CONSTANTS.LIBDIR}/loginhandler.js`, "viewInjector");
    register.addNewUserListener(`${MONASTERY_CONSTANTS.LIBDIR}/loginhandler.js`, "viewInjector");
}

exports.viewInjector = async function(result) {
    if (result.tokenflag) try { result.views = await dblayer.getViewsForDomain(result.domain); }
    catch (err) {return false;}
    return true;
}