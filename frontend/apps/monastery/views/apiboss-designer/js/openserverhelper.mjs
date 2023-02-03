/** 
 * Opens files from the server.
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import {i18n} from "/framework/js/i18n.mjs";
import {util} from "/framework/js/util.mjs";
import {serverManager} from "./serverManager.js";
import {blackboard} from "/framework/js/blackboard.mjs";

const MODULE_PATH = util.getModulePath(import.meta), DIALOG = window.monkshu_env.components["dialog-box"],
    MSG_FILE_UPLOADED = "FILE_UPLOADED";

function init() {
    window.monkshu_env["OPEN_SERVER_HELPER"] = openserverhelper;
}

async function connectServerClicked() {
    const server = DIALOG.getElementValue("server"), port = DIALOG.getElementValue("port"),
    adminid = DIALOG.getElementValue("adminid"), adminpassword = DIALOG.getElementValue("adminpassword");
    const metaDataResult = await serverManager.getMetaData(server, port, adminid,adminpassword);
    if (!metaDataResult.result) {DIALOG.showError(null, await i18n.get(metaDataResult.key)); LOG.error("MetaData fetch failed"); return;}
    else{
         DIALOG.hideError();
        blackboard.broadcastMessage(MSG_FILE_UPLOADED, {name: metaDataResult.name, data: JSON.stringify(metaDataResult.model)});
        DIALOG.hideDialog();
    }
   
}


export const openserverhelper = {init, connectServerClicked};