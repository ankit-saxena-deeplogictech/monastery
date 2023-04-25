/** 
 * Publish rules to the rules engine.
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import { i18n } from "/framework/js/i18n.mjs";
import { util } from "/framework/js/util.mjs";
import { serverManager } from "./serverManager.js";
import { blackboard } from "/framework/js/blackboard.mjs";
import { page_generator } from "/framework/components/page-generator/page-generator.mjs";
import { session } from "/framework/js/session.mjs";
import { html_fragment } from "../../shared/components/html-fragment/html-fragment.mjs";
import { apimanager as apiman } from "/framework/js/apimanager.mjs";

import { loader } from "../../../js/loader.mjs";

const MODULE_PATH = util.getModulePath(import.meta), VIEW_PATH = `${MODULE_PATH}/..`, MSG_GET_MODEL_NAME = "GET_MODEL_NAME",MSG_FILE_UPLOADED = "FILE_UPLOADED",
    MSG_RENAME_MODEL = "RENAME_MODEL", DIALOG_RET_PROPS = ["apikey"],ORG_METADATA = "__org_metadata",
    DIALOG = window.monkshu_env.components["dialog-box"];

let saved_props;

async function openDialog() {
    let pageFile = `${VIEW_PATH}/dialogs/dialog_settings.page`;
    let html = await page_generator.getHTML(new URL(pageFile), null, { modelName: blackboard.getListeners(MSG_GET_MODEL_NAME)[0]({}) || "" });
    const dom = new DOMParser().parseFromString(html, "text/html");
    if (saved_props) for (const id in saved_props) dom.querySelector(`#${id}`).setAttribute("value", saved_props[id]);
    const org = new String(session.get(APP_CONSTANTS.USERORG));
    const userid = new String(session.get(APP_CONSTANTS.USERID));
    const defaultSeverDetails = await apiman.rest(APP_CONSTANTS.API_CREATEORGETSETTINGS, "POST", { org, id: userid }, true, true);
    if(!(defaultSeverDetails.data.server.length && defaultSeverDetails.data.port.length)) dom.querySelector("#apikey").setAttribute("value",defaultSeverDetails.data.publicapikey )
    else dom.querySelector("#apikey").setAttribute("value",defaultSeverDetails.data.apikey )
    let htmlFragment = dom.querySelector('html-fragment#output')
    let htmlContnet = htmlFragment.getAttribute("htmlcontent") ? decodeURIComponent(htmlFragment.getAttribute("htmlcontent")) :
        htmlFragment.getAttribute("htmlfile") ? await $$.requireText(htmlFragment.getAttribute("htmlfile")) : "";
    const tableDom = new DOMParser().parseFromString(htmlContnet, "text/html");
    tableDom.querySelector("textarea#server").textContent = defaultSeverDetails.data.server;
    tableDom.querySelector("textarea#port").textContent = defaultSeverDetails.data.port;
    let htmltext = tableDom.documentElement.outerHTML;
    htmlContnet = encodeURIComponent(htmltext);
    htmlFragment.setAttribute("htmlcontent", htmlContnet);
    html = dom.documentElement.outerHTML;   // this creates HTML with default values set from the previous run

    // now show and run the dialog
    const dialogPropertiesPath = `${VIEW_PATH}/dialogs/dialogPropertiessettings.json`;
    const messageTheme = await $$.requireJSON(`${VIEW_PATH}/dialogs/dialogPropertiesPrompt.json`);
    DIALOG.showDialog(dialogPropertiesPath, html, null, DIALOG_RET_PROPS,
        async (typeOfClose, result, dialogElement) => {
            if (typeOfClose == "submit") {
                const server = html_fragment.getShadowRootByHostId("output").querySelector("textarea#server").value;
                const port = html_fragment.getShadowRootByHostId("output").querySelector("textarea#port").value;
                if(!(server.length && port.length)) {
                    if(!result.apikey){DIALOG.showError(dialogElement, "Please fill the apikey"); return ;}
                     await serverManager.setDefaultSettings(org, userid, server, port, result.apikey,true);
                     const publicServerDetails = await getPublicApibossServerDetails();
                     const publicMetaresult = await apiman.rest(APP_CONSTANTS.API_GETMETADATA, "POST", { org: org, name: "ankit", id: userid, server: publicServerDetails.serverIP, port: publicServerDetails.port, isPublicServer: true }, true, true);
                   if(publicMetaresult.result)  blackboard.broadcastMessage(MSG_FILE_UPLOADED, {name: "ankit", data: JSON.stringify(publicMetaresult.data)});
                   session.set(ORG_METADATA, publicMetaresult.data);

                     return true;
                }
                const localMetaResult = await apiman.rest(APP_CONSTANTS.API_GETMETADATA, "POST", { org: org, name: "ankit", id: userid, server, port }, true, true);
                if(localMetaResult.result){
                const setResult = await serverManager.setDefaultSettings(org, userid, server, port, result.apikey);
                if (!setResult.result) {
                    DIALOG.showError(dialogElement,"APIs are not being Published yet on this server"); return ;}
                else{
                    blackboard.broadcastMessage(MSG_FILE_UPLOADED, {name: "ankit", data: JSON.stringify(localMetaResult.data)});
                    session.set(ORG_METADATA, localMetaResult.data);
                    DIALOG.showMessage("Server Details for Developer Portal has been set successfully", null, null, messageTheme, "MSG_DIALOG");  return true;
                }
            }
            else {DIALOG.showError(dialogElement, "APIs are not being Published yet on this server"); return ;}


            }
        });
}

function _disableButton(element) { element.style["pointer-events"] = "none"; element.style["opacity"] = 0.4; }
function _enableButton(element) { element.style["pointer-events"] = ""; element.style["opacity"] = ""; }

async function getPublicApibossServerDetails() {
    let publicServerDetail = await $$.requireJSON(`${APP_CONSTANTS.CONF_PATH}/serverDetails.json`);
    return publicServerDetail;
}

export const settings = { openDialog };