/**
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
 import { util } from "/framework/js/util.mjs";
 import { monkshu_component } from "/framework/js/monkshu_component.mjs";
 import { floating_window } from "../floating-window/floating-window.mjs"
 
 
 const COMPONENT_PATH = util.getModulePath(import.meta),VIEW_PATH=APP_CONSTANTS.CONF_PATH;

 const CONSOLE_THEME = {
    "var--window-top": "25vh", "var--window-left": "75vh", "var--window-width": "50vw",
    "var--window-height": "45vh", "var--window-background": "#DFF0FE",
    "var--window-border": "1px solid #4788C7", closeIcon: `${COMPONENT_PATH}/close.svg`
}, CONSOLE_HTML_FILE = `${COMPONENT_PATH}/code-snippet-window.html`;
let model,serverDetails,exposedpath;

const elementConnected = async (element) => {
  model = await $$.requireJSON(`${VIEW_PATH}/metadata.json`),serverDetails = await $$.requireJSON(`${VIEW_PATH}/serverdetail.json`);
  exposedpath = `${serverDetails.secure ?"https":"http"}://${serverDetails.hostname}:${serverDetails.port}${model.apis[0]["exposedpath"]}`
}



async function codeSnippetWindow(element) {
    if(element == "NodeJS Client"){
      const floatingWindowHTML = await $$.requireText(CONSOLE_HTML_FILE);
      await floating_window.showWindow("NodeJS", CONSOLE_THEME, floatingWindowHTML);
      console.log(document.querySelector("floating-window"));
      console.log(code_snippet_window.getShadowRootByHostId(document.querySelector("floating-window").getAttribute("id")));
      code_snippet_window.bindData({"exposedpath":exposedpath},document.querySelector("floating-window").getAttribute("id"));

      console.log(document.querySelector("floating-window").getAttribute("id"));

    }
    else if(element == "Java Client"){
      const floatingWindowHTML = await $$.requireText(CONSOLE_HTML_FILE);
      await floating_window.showWindow("JAVA", CONSOLE_THEME, floatingWindowHTML);
    }    
    else if(element == "Curl Client"){
      const floatingWindowHTML = await $$.requireText(CONSOLE_HTML_FILE);
      await floating_window.showWindow("Curl", CONSOLE_THEME, floatingWindowHTML);
      
    }
    // let result = await getFinal(shadowRoot.querySelector('#newTree'));
  }



export const code_snippet_window = {
    trueWebComponentMode: true,  elementConnected , codeSnippetWindow 
  }
  
  monkshu_component.register(
    "code-snippet-window",`${COMPONENT_PATH}/code-snippet-window.html`, code_snippet_window
  );