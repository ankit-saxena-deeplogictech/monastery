import { util } from "/framework/js/util.mjs";
import { apimanager as apiman } from "/framework/js/apimanager.mjs";
import { APP_CONSTANTS } from "../../../js/constants.mjs";
import { serverManager } from "./serverManager.js";
import { loader } from "../../../js/loader.mjs";
import { session } from "/framework/js/session.mjs";

const MODULE_PATH = util.getModulePath(import.meta), VIEW_PATH = `${MODULE_PATH}/..`, ORG_METADATA = "__org_metadata";

function init() {
    window.monkshu_env["ITEMS"] = items;
}

async function getItemList(element) {
    try {
        let model = JSON.parse(await apiman.rest(APP_CONSTANTS.API_GETMETADATA, "GET", {}, false, true));
        session.set(ORG_METADATA, model);
        const items = [];
        await loader.beforeLoading(); _disableButton(element)
        for (const api of model.apis) {
            items.push({
                id: api["apiname"], img: util.resolveURL(`${MODULE_PATH}/../dialogs/model.svg`),
                label: api["apiname"], exposedmethod: api["exposedmethod"]
            })
        }
        if (items.length) await loader.afterLoading(); _enableButton(element);
        return JSON.stringify(items);
    }
    catch (err) {
        LOG.error(`User apis list fetch failed and the error is ${err}`);
        return "[]";
    }
}

function _disableButton(element) { element.style["pointer-events"] = "none"; element.style["opacity"] = 0.4; }
function _enableButton(element) { element.style["pointer-events"] = ""; element.style["opacity"] = ""; }


export const items = { init, getItemList };