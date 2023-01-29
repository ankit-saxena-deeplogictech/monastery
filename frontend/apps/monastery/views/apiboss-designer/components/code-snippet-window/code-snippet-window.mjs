/**
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
 import { util } from "/framework/js/util.mjs";
 import { monkshu_component } from "/framework/js/monkshu_component.mjs";
 import { floating_window } from "../floating-window/floating-window.mjs";
 import { code_editor } from "../code-editor/code-editor.mjs";
 const COMPONENT_PATH = util.getModulePath(import.meta),VIEW_PATH=APP_CONSTANTS.CONF_PATH;

 const CONSOLE_THEME = {
    "var--window-top": "25vh", "var--window-left": "75vh", "var--window-width": "50vw",
    "var--window-height": "45vh", "var--window-background": "#DFF0FE",
    "var--window-border": "1px solid #4788C7", closeIcon: `${COMPONENT_PATH}/close.svg`
}, CONSOLE_HTML_FILE = `${COMPONENT_PATH}/code-snippet-window.html`, CONSOLE_HTML_JAVA_FILE = `${COMPONENT_PATH}/code-snippet-window-java.html`,
  CONSOLE_HTML_CURL_FILE = `${COMPONENT_PATH}/code-snippet-window-curl.html`;
let exposedpath, token, key, exposedmethod,floatingWindowID,floatingWindowHTMLJavaID,floatingWindowHTMLCurlID,attrData;


function setExposedPathAndMethod(path, method){
  exposedpath = path;
  exposedmethod = method;
  return;
}

function ifAuthSetAuth(authToken){
  token = authToken;
  return;
}

function ifKeySetKey(apiKey){
  key = apiKey;
  return;
}

async function codeSnippetWindow(element) {
  if(floatingWindowID)  floating_window.hideWindow(floatingWindowID);
  if(floatingWindowHTMLJavaID) floating_window.hideWindow(floatingWindowHTMLJavaID);
  if(floatingWindowHTMLCurlID) floating_window.hideWindow(floatingWindowHTMLCurlID)


    if(element == "NodeJS Client"){
      if(floatingWindowID)  floating_window.hideWindow(floatingWindowID)
      const floatingWindowHTML = await $$.requireText(CONSOLE_HTML_FILE); 
      floatingWindowID =  await floating_window.showWindow("NodeJS", CONSOLE_THEME, Mustache.render(floatingWindowHTML,{}));
    setNodeJSValue();
    }
    else if(element == "Java Client"){
     const floatingWindowHTMLJava  = await $$.requireText(CONSOLE_HTML_JAVA_FILE);
     floatingWindowHTMLJavaID = await floating_window.showWindow("JAVA", CONSOLE_THEME, Mustache.render(floatingWindowHTMLJava, {}));
     setJavaValue();
    }    
    else if(element == "Curl Client"){
      const floatingWindowHTMLCurl = await $$.requireText(CONSOLE_HTML_CURL_FILE);
      floatingWindowHTMLCurlID = await floating_window.showWindow("Curl", CONSOLE_THEME, Mustache.render(floatingWindowHTMLCurl, {}));
      setShellValue();
    }
  }



 async function setNodeJSValue(){
  console.log(attrData);
  if(document.querySelector(`floating-window`) && floatingWindowID){
    let data = ` const https = require("https");
    const options = {
      method: ${exposedmethod},
      headers: {
          accept: 'application/json',
          ${token?`authorization: 'Bearer`:""} ${token?`${token}'`+',':""}
          ${key?"apikey:":""} ${key?`'${key}'`:""}
      }${attrData?",":""}
      ${attrData?"attributes:":""} ${attrData?JSON.stringify(attrData,null,4):""}
    }
    https.request('${exposedpath}', options, (resp)=>{
              
    // The whole response has been received. Print out the result
      resp.on("end", ()=>{
         console.log(JSON.parse(data).explanation);
          });
       }); `

       data =data.replace(/^\s*\n/gm, "");
      await code_editor.setValue(data,floating_window.getShadowRootByHostId(floatingWindowID).querySelector("code-editor#nodejs"),"javascript");
  }
  }

  async function setJavaValue(){
    console.log(attrData);
    if(document.querySelector(`floating-window`) && floatingWindowHTMLJavaID){
      let data = `OkHttpClient client = new OkHttpClient();

      MediaType mediaType = MediaType.parse("application/json");
      ${attrData?`RequestBody body = RequestBody.create(mediaType,${attrData?JSON.stringify(attrData,null,4):""});`: ""});
      Request request = new Request.Builder()
        .url('${exposedpath}')
        .post(${exposedmethod})
        .addHeader("accept", "application/json")
        ${token?`.addHeader("authorization", "Bearer ${token?token:''}")`:""}
        ${key?`.addHeader("apikey", "${key?key:''}")`:""}

        .build();
      
      Response response = client.newCall(request).execute(); `
  
         data =data.replace(/^\s*\n/gm, "");
        await code_editor.setValue(data,floating_window.getShadowRootByHostId(floatingWindowHTMLJavaID).querySelector("code-editor#java"),"java");
    }
    }

    async function setShellValue(){
      if(document.querySelector(`floating-window`) && floatingWindowHTMLCurlID){
        let data = `curl --request ${exposedmethod} \\
        --url ${exposedpath} \\
        --header 'accept: application/json' \\
        ${token?`--header 'authorization: Bearer ${token?token:""}' \\ `:""} 
        ${key?`--header 'apikey:${key?key:""}'  \\`:""} 
        ${attrData?`--data '${attrData?JSON.stringify(attrData,null,4):""} e()'`:""} `
    
           data =data.replace(/^\s*\n/gm, "");
          await code_editor.setValue(data,floating_window.getShadowRootByHostId(floatingWindowHTMLCurlID).querySelector("code-editor#curl"),"curl");
      }
      }

   function setAttributeData(data){
    attrData = data;
    setNodeJSValue();
    setJavaValue();
    setShellValue();
  }

export const code_snippet_window = {
    trueWebComponentMode: true , codeSnippetWindow, setExposedPathAndMethod, ifAuthSetAuth, ifKeySetKey, setNodeJSValue,setAttributeData,setJavaValue,setShellValue
  }
  
  monkshu_component.register(
    "code-snippet-window",`${COMPONENT_PATH}/code-snippet-window.html`, code_snippet_window
  );