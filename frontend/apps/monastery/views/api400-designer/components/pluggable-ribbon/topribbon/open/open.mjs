/* 
 * (C) 2020 TekMonks. All rights reserved.
 */
import { view } from "../../../../view.mjs"
import { i18n } from "/framework/js/i18n.mjs";
import { util } from "/framework/js/util.mjs";
import { blackboard } from "/framework/js/blackboard.mjs";
import { serverManager } from "../../../../js/serverManager.js";
import { page_generator } from "/framework/components/page-generator/page-generator.mjs";
import { apiclparser } from "../../../../model/apiclparser.mjs"

const PLUGIN_PATH = util.getModulePath(import.meta), MSG_FILE_UPLOADED = "FILE_UPLOADED", FILE_UPLOADED_FROM_DISK = "UPLOADED_FROM_DISK ",
    CONTEXT_MENU = window.monkshu_env.components["context-menu"], CONTEXT_MENU_ID = "contextmenumain",
    DIALOG_RET_PROPS = ["name", "server", "port", "adminid", "adminpassword"],
    DIALOG = window.monkshu_env.components["dialog-box"], VIEW_PATH = `${PLUGIN_PATH}/../../../../`;
let IMAGE, I18N, saved_props;

async function init() {
    const svgSource64 = btoa(await (await fetch(`${PLUGIN_PATH}/open.svg`)).text());
    IMAGE = "data:image/svg+xml;base64," + svgSource64;
    I18N = (await import(`${PLUGIN_PATH}/open.i18n.mjs`)).i18n;
    return true;
}

async function clicked(element, event) {
    event.stopPropagation(); const lang = i18n.getSessionLang();
    const menus = {}; menus[`${I18N.NEW[lang]}`] = _ => view.reset(); menus[`${I18N.OPEN_FROM_DISK[lang]}`] = _ => _uploadFile();
    menus[`${I18N.OPEN_FROM_SERVER[lang]}`] = _ => _getFromServer();
    const boundingRect = element.getBoundingClientRect(), x = boundingRect.x, y = boundingRect.bottom;
    CONTEXT_MENU.showMenu(CONTEXT_MENU_ID, menus, x, y, 0, 5);
}

const getImage = _ => IMAGE, getHelpText = (lang = en) => I18N.HELP_TEXTS[lang]
    getDescriptiveName = (lang = en) => I18N.DESCRIPTIVE_NAME[lang],
    allowDrop = event => _isDraggedItemAJSONFile(event);

async function droppedFile(event) {
    event.preventDefault(); if (!_isDraggedItemAJSONFile(event)) return; // can't support whatever was dropped
    const file = event.dataTransfer.items[0].getAsFile();
    try {
        const { name, data } = await util.getFileData(file);
        blackboard.broadcastMessage(MSG_FILE_UPLOADED, { name, data });
    } catch (err) { LOG.error(`Error opening file: ${err}`); }
}

async function _uploadFile() {
    try {
        let { name, data } = await uploadAFile("*/*"); data = await apiclparser.apiclParser(data, FILE_UPLOADED_FROM_DISK);
        if (data) { data = JSON.stringify(data); blackboard.broadcastMessage(MSG_FILE_UPLOADED, { name, data }); }
    } catch (err) { LOG.error(`Error opening file: ${err}`); }
}

async function _getFromServer() {
    const pageFile = util.resolveURL(`${VIEW_PATH}/dialogs/dialog_openserver.page`);
    let html = await page_generator.getHTML(new URL(pageFile));
    const dom = new DOMParser().parseFromString(html, "text/html");
    
    if (saved_props) for (const id in saved_props) dom.querySelector(`#${id}`).setAttribute("value", saved_props[id]);
    html = dom.documentElement.outerHTML;   // this creates HTML with default values set from the previous run

    // now show and run the dialog
    const dialogPropertiesPath = util.resolveURL(`${VIEW_PATH}/dialogs/dialogPropertiesopenserver.json`);
    DIALOG.showDialog(dialogPropertiesPath, html, null, DIALOG_RET_PROPS,
        async (typeOfClose, result) => {
            if (typeOfClose == "submit") {
                saved_props = util.clone(result, ["adminpassword"]); // don't save password, for security
                const selectedModel = result.packages, readModelResult = serverManager.getApicl(selectedModel, result.server,
                    result.port, result.adminid, result.adminpassword);
                if (!readModelResult.result) DIALOG.showError(dialogElement, await i18n.get(readModelResult.key));
                else blackboard.broadcastMessage(MSG_FILE_UPLOADED, {
                    name: selectedModel,
                    data: readModelResult.model
                });
            }
        });
}

/**
 * Uploads a single file.
 * @param accept Optional: The MIME type to accept. Default is "*".
 * @param type Optional: Can be "text" or "binary". Default is "text".
 * @returns A promise which resolves to {name - filename, data - string or ArrayBuffer} or rejects with error
 */
function uploadAFile(accept = "*/*", type = "text") {
    const uploadFiles = _ => new Promise(resolve => {
        const uploader = document.createElement("input"); uploader.setAttribute("type", "file");
        uploader.style.display = "none"; uploader.setAttribute("accept", accept);

        document.body.appendChild(uploader); uploader.onchange = _ => { resolve(uploader.files); document.body.removeChild(uploader); };
        uploader.click();
    });

    return new Promise(async (resolve, reject) => {
        const file = (await uploadFiles())[0]; if (!file) { reject("User cancelled upload"); return; }
        try { resolve(await getFileData(file, type)); } catch (err) { reject(err); }
    });
}

/**
 * Reads the given file and returns its data.
 * @param file The File object
 * @param type Optional: Can be "text" or "binary". Default is "text".
 * @returns A promise which resolves to {name - filename, data - string or ArrayBuffer} or rejects with error
 */
function getFileData(file, type = "text") {
    const apiclRegex = /(\.apicl)/;
    if (apiclRegex.test(file.name)) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = event => resolve({ name: file.name, data: event.target.result });
            reader.onerror = _event => reject(reader.error);
            if (type.toLowerCase() == "text") reader.readAsText(file); else reader.readAsArrayBuffer(file);
        });
    } else { alert('Only apicl files are allowed'); }
}

const _isDraggedItemAJSONFile = event => event.dataTransfer.items?.length && event.dataTransfer.items[0].kind === "file"
    && event.dataTransfer.items[0].type.toLowerCase() === "application/json";

export const open = { init, clicked, getImage, getHelpText, getDescriptiveName, allowDrop, droppedFile }