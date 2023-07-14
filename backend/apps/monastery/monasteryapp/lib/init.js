/**
 * Shows how to init apps embedded into the login app.
 * (C) 2023 TekMonks. All rights reserved.
 */

const fs = require("fs");
const mustache = require("mustache");
const MONASTERY_CONSTANTS = LOGINAPP_CONSTANTS.ENV.MONASTERYAPP_CONSTANTS;

exports.initSync = _ => {
    _readConfSync();    // the files below need constants to be setup properly so require them after conf is setup

    // const fileindexer = require(`${MONASTERY_CONSTANTS.LIBDIR}/fileindexer.js`);
    const loginhandler = require(`${MONASTERY_CONSTANTS.LIBDIR}/loginhandler.js`);
    loginhandler.init(); 
    // fileindexer.init();
}

function _readConfSync() {
    // const confjson = mustache.render(fs.readFileSync(`${MONASTERY_CONSTANTS.CONFDIR}/neuranet.json`, "utf8"), 
    //     MONASTERY_CONSTANTS).replace(/\\/g, "\\\\");   // escape windows paths
    // MONASTERY_CONSTANTS.CONF = JSON.parse(confjson);
}