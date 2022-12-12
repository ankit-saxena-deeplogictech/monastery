/** 
 * Opens files from the server.
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import { i18n } from "/framework/js/i18n.mjs";
import { util } from "/framework/js/util.mjs";
import { serverManager } from "./serverManager.js";
import { session } from "/framework/js/session.mjs";
import { blackboard } from "/framework/js/blackboard.mjs";
import { password_box } from "../../../components/password-box/password-box.mjs";

const MODULE_PATH = util.getModulePath(import.meta), DIALOG = window.monkshu_env.components["dialog-box"],
    MSG_FILE_UPLOADED = "FILE_UPLOADED";

function init() {
    window.monkshu_env["OPEN_SERVER_HELPER"] = openserverhelper;
}

async function connectServerClicked(dialogElement) {
    const server = DIALOG.getElementValue("server"), port = DIALOG.getElementValue("port"),
        adminid = DIALOG.getElementValue("adminid"), adminpassword = password_box.getShadowRootByHostId("adminpassword").querySelector("#pwinput").value;
    const listResult = await serverManager.getApiclList(server, port, adminid, adminpassword, dialogElement);
    if (!listResult.result) { DIALOG.showError(null, await i18n.get(listResult.key)); LOG.error("Apicl list fetch failed"); return; }
    else DIALOG.hideError();
    const items = []; for (const modelName of listResult.apicls) items.push({
        id: modelName,
        img: util.resolveURL(`${MODULE_PATH}/../dialogs/model.svg`), label: modelName
    });
    DIALOG.getElement("packages").value = (JSON.stringify(items));
    let sessionConArray = [];
    sessionConArray = (session.get("__org_api400_server")) ? session.get("__org_api400_server") : [];
    if (!sessionConArray.includes(`${adminid}@${server}:${port}`))
        sessionConArray.push(`${adminid}@${server}:${port}`);
    session.set("__org_api400_server", sessionConArray);
}

async function openClicked(_elementSendingTheEvent, idOfPackageToOpen) {
    const server = DIALOG.getElementValue("server"), port = DIALOG.getElementValue("port"),
        adminid = DIALOG.getElementValue("adminid"), adminpassword = password_box.getShadowRootByHostId("adminpassword").querySelector("#pwinput").value;
    const modelResult = await serverManager.getApicl(idOfPackageToOpen, server, port, adminid, adminpassword, _elementSendingTheEvent);
    if (!modelResult.result) { DIALOG.showError(null, await i18n.get(modelResult.key)); LOG.error("Apicl fetch failed"); return; }
    else {
        DIALOG.hideError();
        blackboard.broadcastMessage(MSG_FILE_UPLOADED, { name: modelResult.name, data: modelResult.apicl });
        DIALOG.hideDialog();
    }

}

async function serverDetails() {
    try {
        const server = DIALOG.getElementValue("server"), port = DIALOG.getElementValue("port"),
            adminid = DIALOG.getElementValue("adminid"), adminpassword = password_box.getShadowRootByHostId("adminpassword").querySelector("#pwinput").value;
        return { server, port, adminid, adminpassword };
    }
    catch (err) {
        LOG.error(`Failed to get server Details, ${err}`)
        return false;
    }
}

async function populateServerDetails(value) {

    let temp = value.split("@");
    let admin = temp[0];
    let server = temp[1];
    DIALOG.getElement("server").value = server.split(":")[0];
    DIALOG.getElement("port").value = server.split(":")[1];
    DIALOG.getElement("adminid").value = admin;

}


export const openserverhelper = { init, connectServerClicked, openClicked, serverDetails, populateServerDetails };
