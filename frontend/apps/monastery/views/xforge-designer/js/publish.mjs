/** 
 * Publish apicl to the api400.
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import {i18n} from "/framework/js/i18n.mjs";
import {util} from "/framework/js/util.mjs";
import {serverManager} from "./serverManager.js";
import {blackboard} from "/framework/js/blackboard.mjs";
import {model} from "../model/model.mjs";
import {page_generator} from "/framework/components/page-generator/page-generator.mjs";
import { password_box } from "../../../components/password-box/password-box.mjs";
import { session } from "/framework/js/session.mjs";


const MODULE_PATH = util.getModulePath(import.meta), VIEW_PATH=`${MODULE_PATH}/..`, MSG_GET_MODEL_NAME = "GET_MODEL_NAME", 
    MSG_RENAME_MODEL = "RENAME_MODEL", DIALOG_RET_PROPS = ["name", "server", "port", "adminid", "adminpassword"], 
    DIALOG = window.monkshu_env.components["dialog-box"];

let saved_props;

async function openDialog() {
    let pageFile =  `${VIEW_PATH}/dialogs/dialog_publish.page`,
    html = await page_generator.getHTML(new URL(pageFile), null, {modelName: blackboard.getListeners(MSG_GET_MODEL_NAME)[0]({})||""});

    const dom = new DOMParser().parseFromString(html, "text/html");
    if (saved_props) for (const id in saved_props) dom.querySelector(`#${id}`).setAttribute("value", saved_props[id]);
    html = dom.documentElement.outerHTML;   // this creates HTML with default values set from the previous run

    // now show and run the dialog
    const dialogPropertiesPath = `${VIEW_PATH}/dialogs/dialogPropertiespublish.json`;
    const messageTheme = await $$.requireJSON(`${VIEW_PATH}/dialogs/dialogPropertiesPrompt.json`);
    DIALOG.showDialog(dialogPropertiesPath, html, null, DIALOG_RET_PROPS, 
        async (typeOfClose, result, dialogElement) => { if (typeOfClose == "submit") {
            saved_props = util.clone(result, ["adminpassword"]); // don't save password, for security
            const org = new String(session.get(APP_CONSTANTS.USERORG)); 
            const userid = new String(session.get(APP_CONSTANTS.USERID));
            const finalData = model.getModel();
            const scriptData = model.getScripts();
            result.adminpassword=password_box.getShadowRootByHostId("adminpassword").querySelector("#pwinput").value;
            if(!scriptData.result) {
                DIALOG.showError(dialogElement, scriptData.key); return}
            else {
             const pubScripts = await serverManager.publishScripts(scriptData.data,org,userid, result.server, result.port);
             if(!pubScripts.result) {
                DIALOG.showError(dialogElement, await i18n.get(pubScripts.key));return
             }
            const pubResult = await serverManager.publishMetaData(finalData,org,userid, result.server, result.port);
            blackboard.broadcastMessage(MSG_RENAME_MODEL, {name: "xforge"});
            if (!pubResult.result) DIALOG.showError(dialogElement, await i18n.get(pubResult.key)); 
            else {DIALOG.showMessage(await i18n.get("PublishSuccess"), "ok", null, messageTheme, "MSG_DIALOG");  return true;}}
        } });
}

export const publish = {openDialog};