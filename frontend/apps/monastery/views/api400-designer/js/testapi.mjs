/** 
 * UnPublish apicl to the api400 engine.
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import { i18n } from "/framework/js/i18n.mjs";
import { util } from "/framework/js/util.mjs";
import { serverManager } from "./serverManager.js";
import { api400model } from "../model/api400model.mjs";
import { blackboard } from "/framework/js/blackboard.mjs";
import { page_generator } from "/framework/components/page-generator/page-generator.mjs";
import { password_box } from "../../../components/password-box/password-box.mjs";

const MODULE_PATH = util.getModulePath(import.meta), VIEW_PATH = `${MODULE_PATH}/..`, MSG_GET_MODEL_NAME = "GET_MODEL_NAME",
    DIALOG_RET_PROPS = ["header", "body", "response", "server", "port", "adminid", "adminpassword"],
    DIALOG = window.monkshu_env.components["dialog-box"], FLOATING_WINDOW = window.monkshu_env.components["floating-window"],
    CONSOLE_THEME = {
        "var--window-top": "25vh", "var--window-left": "75vh", "var--window-width": "40vw",
        "var--window-height": "40vh", "var--window-background": "#DFF0FE",
        "var--window-border": "1px solid #4788C7", closeIcon: `${MODULE_PATH}/../dialogs/close.svg`
    }, CONSOLE_HTML_FILE = `${MODULE_PATH}/../dialogs/dialog_console.html`;

let saved_props;

async function openDialog() {
    let pageFile = `${VIEW_PATH}/dialogs/dialog_testapi.page`;
    const floatingWindowHTML = await $$.requireText(CONSOLE_HTML_FILE);

    let html = await page_generator.getHTML(new URL(pageFile), null, { modelName: blackboard.getListeners(MSG_GET_MODEL_NAME)[0]({}) || "" });

    const dom = new DOMParser().parseFromString(html, "text/html");
    if (saved_props) for (const id in saved_props) {
        if (dom.querySelector(`textarea#${id}`))
            (saved_props[id]) ? (dom.querySelector(`#${id}`).innerHTML = saved_props[id]) : '';
        else
            (saved_props[id]) ? (dom.querySelector(`#${id}`).setAttribute('value', saved_props[id])) : '';
    }
    html = dom.documentElement.outerHTML;   // this creates HTML with default values set from the previous run

    // now show and run the dialog
    const dialogPropertiesPath = `${VIEW_PATH}/dialogs/dialogPropertiestestapi.json`;
    DIALOG.showDialog(dialogPropertiesPath, html, null, DIALOG_RET_PROPS,
        async (typeOfClose, result, dialogElement) => {
            if (typeOfClose == "submit") {
                saved_props = util.clone(result, ["adminpassword"]); // don't save password, for security
                result.adminpassword = password_box.getShadowRootByHostId("adminpassword").querySelector("#pwinput").value;

                try {
                    const api400mod = api400model.getModel(), jsModule = api400model.getModules();
                    if (jsModule.length != 0) {
                        const pubModResult = await serverManager.publishModule(result.server, result.port, result.adminid, result.adminpassword, dialogElement);
                        if (!pubModResult.result) { await DIALOG.showError(dialogElement, await i18n.get(pubModResult.key)); return null; }
                    }
                    let tempApiName = `ID${Date.now()}`;
                    const header = DIALOG.getElementValue("header"), body = DIALOG.getElementValue("body");
                    // Step 1 : Publish the API
                    const pubResult = await serverManager.publishApicl(api400mod, tempApiName, result.server, result.port, result.adminid, result.adminpassword, dialogElement);
                    if (!pubResult.result) { DIALOG.showError(dialogElement, await i18n.get(pubResult.key)); return; }

                    // Step 2 : Call the API
                    const apiResult = await serverManager.callApi(tempApiName, result.server, result.port, header, body, dialogElement);
                    if (apiResult){
                        await FLOATING_WINDOW.showWindow(CONSOLE_THEME, Mustache.render(floatingWindowHTML, { message: `${JSON.stringify(apiResult, null, 2)}`, error: undefined }));
                        if (!apiResult.result) DIALOG.showError(dialogElement, await i18n.get("TestAPIFailed"));

                    }  
                    // Step 3 : Remove the API
                    if (pubResult && pubResult.result) {
                        const unPubResult = await serverManager.unpublishApicl(tempApiName, result.server, result.port, result.adminid, result.adminpassword, dialogElement);
                        if (!unPubResult.result) DIALOG.showError(dialogElement, await i18n.get(unPubResult.key));
                    } 
                } catch (error) {
                    LOG.error(`[TEST API] Error :${error}`);
                    DIALOG.showError(dialogElement, await i18n.get("TestAPIFailed"));
                }

                
            }
        }
    );
}

export const testapi = { openDialog };