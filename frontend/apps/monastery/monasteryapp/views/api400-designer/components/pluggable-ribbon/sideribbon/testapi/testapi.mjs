/** 
 * (C) 2020 TekMonks. All rights reserved.
 */
import {util} from "/framework/js/util.mjs";
import {newRibbonButton} from "../../lib/ribbonButton.mjs";
import {testapi as testModule} from "../../../../js/testapi.mjs"

const MODULE_PATH = util.getModulePath(import.meta);

const parentNode = newRibbonButton();
const init = async _ => { await parentNode.init("testapi", MODULE_PATH,  {click: _=>testModule.openDialog()}); return true; }
    


export const testapi = {init, ...parentNode};