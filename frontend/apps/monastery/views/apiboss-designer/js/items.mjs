import { util } from "/framework/js/util.mjs";
import { apimanager as apiman } from "/framework/js/apimanager.mjs";
import { APP_CONSTANTS } from "../../../js/constants.mjs";
import { serverManager } from "./serverManager.js";
import { loader } from "../../../js/loader.mjs";

const MODULE_PATH = util.getModulePath(import.meta), VIEW_PATH=`${MODULE_PATH}/..`;

 

function init() {
    window.monkshu_env["ITEMS"] = items;
}

async function getItemList(element) {
    try {
      let  model = await $$.requireJSON(`${VIEW_PATH}/conf/metadata.json`);      // const serverDetails = JSON.parse(await apiman.rest(APP_CONSTANTS.API_GETAPPCONFIG, "POST", {}, true));

        // // const loginResult = await serverManager.loginToServer(serverDetails.host, serverDetails.port, serverDetails.adminid,serverDetails.adminpassword);
        // // if (!loginResult.result) return loginResult;    // failed to connect or login
        // console.log(serverDetails);
        // const result = JSON.parse(await apiman.rest(`http://${serverDetails.host}:${serverDetails.port}/apps/apiboss/admin/listuserapis`, "POST", { "data": { "path": "/apps/apiboss/admin/listuserapis", } }, true));
        // console.log(result);
        // if (result.data && result.data.result) {
        //     const models = result.data.apis.map(apis => {
        //         const d = apis.split("/"); return d[d.length - 1];
        //     })

        //     const methods = result.data.apisvalue.map(value => {
        //         const urlParams = new URLSearchParams(value.split("?")[1]);
        //         // console.log(urlParams);
        //         // console.log(urlParams.has('method'));
        //         if (!urlParams.has('method')) return "GET";
        //         else return urlParams.get('method');

        //     })
        //     console.log(methods);
        const items = [];
        await loader.beforeLoading(); _disableButton(element)
        for (const api of model.apis){
            items.push({
                id:api["apiname"],img: util.resolveURL(`${MODULE_PATH}/../dialogs/model.svg`),
                label:api["apiname"],exposedmethod:api["exposedmethod"]})}
            //  for (let i = 0; i < models.length; i++) items.push({
            //     id: models[i],
            //      label: models[i], method: methods[i]
            // });
        if(items.length) await loader.afterLoading(); _enableButton(element);
            return JSON.stringify(items);
        // }
    }
    catch (err) {
        LOG.error(`User apis list fetch failed and the error is ${err}`);
        return "[]";
    }
}

function _disableButton(element){ element.style["pointer-events"]="none"; element.style["opacity"]=0.4; }
function _enableButton(element){ element.style["pointer-events"]=""; element.style["opacity"]=""; }


export const items = { init, getItemList };