import { util } from "/framework/js/util.mjs";
import { apimanager as apiman } from "/framework/js/apimanager.mjs";
import { APP_CONSTANTS } from "../../../js/constants.mjs";
import { loader } from "../../../js/loader.mjs";
import { session } from "/framework/js/session.mjs";
import {securityguard} from "/framework/js/securityguard.mjs";

import {dialog} from "../page/dialog.js";

const MODULE_PATH = util.getModulePath(import.meta), VIEW_PATH = `${MODULE_PATH}/..`, ORG_METADATA = "__org_metadata";



async function getItemList() {
    try {
       const serverDetails = JSON.parse(session.get("__org_server_details"));
        let metadata;
        const org = new String(session.get(APP_CONSTANTS.USERORG)).toLowerCase();
        const userid = new String(session.get(APP_CONSTANTS.USERID)).toLowerCase();
        const role = securityguard.getCurrentRole();
        await loader.beforeLoading();
        
        let result = await apiman.rest(APP_CONSTANTS.API_GETMETADATA, "POST", { org: org,name:serverDetails.name, id: userid,server:serverDetails.host,port:serverDetails.port }, true, true);
        if (result.result&& result.data && Object.keys(result.data).length > 0 ) {
            metadata = result.data;
            session.set(ORG_METADATA, metadata);
        } 
        const items = [];
        if (metadata) {
            for (const api of metadata.apis) {
                items.push({
                    id: api["apiname"], img: util.resolveURL(`${MODULE_PATH}/../dialogs/model.svg`),
                    label: api["apiname"], exposedmethod: api["exposedmethod"]
                })
            }
            await loader.afterLoading(); 
            return JSON.stringify(items);
        }
        else {
            await loader.afterLoading();
            if(role==APP_CONSTANTS.ADMIN_ROLE) await dialog.adminDialog();
            else if(role==APP_CONSTANTS.USER_ROLE) await dialog.userDialog();
            return "[]";
        }

    }
    catch (err) {
        LOG.error(`User apis list fetch failed and the error is ${err}`);
        if (document.querySelector('.spinner')) await loader.afterLoading();
        return "[]";
    }
}

function _disableButton(element) { element.style["pointer-events"] = "none"; element.style["opacity"] = 0.4; }
function _enableButton(element) { element.style["pointer-events"] = ""; element.style["opacity"] = ""; }


export const items = {  getItemList };