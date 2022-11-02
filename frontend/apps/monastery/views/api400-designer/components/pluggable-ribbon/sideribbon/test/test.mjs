/** 
 * (C) 2020 TekMonks. All rights reserved.
 */
import {util} from "/framework/js/util.mjs";
import {newRibbonButton} from "../../lib/ribbonButton.mjs";
import {test as testModule} from "../../../../js/test.mjs"

const MODULE_PATH = util.getModulePath(import.meta);

const parentNode = newRibbonButton();
const init = async _ => { await parentNode.init("test", MODULE_PATH,  {click: _=>testModule.openDialog()}); return true; }
    


export const test = {init, ...parentNode};