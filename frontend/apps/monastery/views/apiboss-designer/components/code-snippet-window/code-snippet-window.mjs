/**
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
 import { util } from "/framework/js/util.mjs";
 import { monkshu_component } from "/framework/js/monkshu_component.mjs";
 import { floating_window } from "../floating-window/floating-window.mjs";
 import { api_contents } from "../api-contents/api-contents.mjs";
 
 
 const COMPONENT_PATH = util.getModulePath(import.meta),VIEW_PATH=APP_CONSTANTS.CONF_PATH;

 const CONSOLE_THEME = {
    "var--window-top": "25vh", "var--window-left": "75vh", "var--window-width": "50vw",
    "var--window-height": "45vh", "var--window-background": "#DFF0FE",
    "var--window-border": "1px solid #4788C7", closeIcon: `${COMPONENT_PATH}/close.svg`
}, CONSOLE_HTML_FILE = `${COMPONENT_PATH}/code-snippet-window.html`;
let exposedpath;


function setExposedPath(path){
  console.log(path)
  exposedpath = path;
  return;
}


async function codeSnippetWindow(element) {
  console.log(exposedpath);
    if(element == "NodeJS Client"){
      const floatingWindowHTML = await $$.requireText(CONSOLE_HTML_FILE);
      await floating_window.showWindow("NodeJS", CONSOLE_THEME, Mustache.render(floatingWindowHTML, {exposedpath: `${exposedpath}`, error: undefined}));
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
    trueWebComponentMode: true , codeSnippetWindow, setExposedPath
  }
  
  monkshu_component.register(
    "code-snippet-window",`${COMPONENT_PATH}/code-snippet-window.html`, code_snippet_window
  );