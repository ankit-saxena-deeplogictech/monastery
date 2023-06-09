import { util } from "/framework/js/util.mjs";
import { i18n } from "/framework/js/i18n.mjs";
import { apimanager as apiman } from "/framework/js/apimanager.mjs";
import {session} from "/framework/js/session.mjs";
import {loader} from "../../../js/loader.mjs";
import { password_box } from "../../../../loginappframework/components/password-box/password-box.mjs";
import {exConfirmPromise} from "./generate-warning-dialog.mjs"

const MODULE_PATH = util.getModulePath(import.meta);
const CONSOLE_THEME = {
  "var--window-top": "25vh", "var--window-left": "75vh", "var--window-width": "40vw",
  "var--window-height": "40vh", "var--window-background": "#DFF0FE",
  "var--window-border": "1px solid #4788C7", closeIcon: `${MODULE_PATH}/../dialogs/close.svg`
}, CONSOLE_HTML_FILE = `${MODULE_PATH}/../dialogs/dialog_console.html`;


function init() {
    window.monkshu_env["TEST_SQL"] = testsql;
}

async function testSQL(element) {
  const text_editor =  window.monkshu_env.components["text-editor"];

    const cm = text_editor.memory.sql.editor, value = cm.getDoc().getValue();
    if (value && (value.includes("INSERT") || value.includes("DELETE") || value.includes("UPDATE"))) {
      let configOpt = {
        title: "[WARNING]",
      };
      if (!session.get("checkbox_selected"))  session.set("checkbox_selected",{"status":false}); 
      if(!session.get("checkbox_selected").status) exConfirmPromise.make(configOpt).then(async function (userOption) {
        const cb = document.querySelector('#accept');
        if(cb.checked) session.set("checkbox_selected", {"status":true});
        if (userOption) await _showOutput(value,element);
      })
      else  await _showOutput(value,element);
    }
    else await _showOutput(value,element);
  
  }
  
  async function _showOutput(value,element) {
   
    const DIALOG = window.monkshu_env.components["dialog-box"], FLOATING_WINDOW = window.monkshu_env.components["floating-window"],
      floatingWindowHTML = await $$.requireText(CONSOLE_HTML_FILE);
    const server = DIALOG.getElementValue("server"), port = DIALOG.getElementValue("port"),
      user = DIALOG.getElementValue("adminid"), password = password_box.getShadowRootByHostId("adminpassword").querySelector("#pwinput").value;
    CONSOLE_THEME.title = await i18n.get("output");  DIALOG.hideError();
    try {
      await loader.beforeLoading();_disableButton(element)

    let  result = await apiman.rest(`http://${server}:${port}/admin/testSQL`, "POST", { user, password, value }, true);
      if (typeof result == "string") result = JSON.parse(result);

      
      if (!result){ DIALOG.showError(null, await i18n.get("ConnectIssue"));      await loader.afterLoading();_enableButton(element);  return }
      else if (result.hasOwnProperty("cause")) throw `RunningFailed`;
      else if (!result.result) throw `FetchFailed`;
      await loader.afterLoading();_enableButton(element)
      await FLOATING_WINDOW.showWindow(CONSOLE_THEME, Mustache.render(floatingWindowHTML, { message: `Output of the Test SQL as follows : \n\n${JSON.stringify(result.data, null, 4)}`, error: undefined }));
    }
    catch (err) { 
      await loader.afterLoading();_enableButton(element)
       await FLOATING_WINDOW.showWindow(CONSOLE_THEME, Mustache.render(floatingWindowHTML, { message: `Output of the Test SQL as follows : ${ await i18n.get(err)}`, error: true }));
    }
  
  }
  function _disableButton(element){
    element.style["pointer-events"]="none";
    element.style["opacity"]=0.4;
  }
  function _enableButton(element){
    element.style["pointer-events"]="";
    element.style["opacity"]="";
  }
  
 

  export const testsql = {init,testSQL};