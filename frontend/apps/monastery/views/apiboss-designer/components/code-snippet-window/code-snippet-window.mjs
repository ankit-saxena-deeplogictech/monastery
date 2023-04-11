/**
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
 import { util } from "/framework/js/util.mjs";
 import { monkshu_component } from "/framework/js/monkshu_component.mjs";
 import { floating_window } from "../floating-window/floating-window.mjs";
 import { code_editor } from "../code-editor/code-editor.mjs";
 import { api_details } from "../api-details/api-details.mjs";
 import { session } from "/framework/js/session.mjs";
 const COMPONENT_PATH = util.getModulePath(import.meta),VIEW_PATH=APP_CONSTANTS.CONF_PATH;
 let serverDetails;


 const CONSOLE_THEME = {
    "var--window-top": "25vh", "var--window-left": "75vh", "var--window-width": "50vw",
    "var--window-height": "45vh", "var--window-background": "#DFF0FE",
    "var--window-border": "1px solid #4788C7", closeIcon: `${COMPONENT_PATH}/close.svg`
}, CONSOLE_HTML_FILE = `${COMPONENT_PATH}/code-snippet-window.html`, CONSOLE_HTML_JAVA_FILE = `${COMPONENT_PATH}/code-snippet-window-java.html`,
  CONSOLE_HTML_CURL_FILE = `${COMPONENT_PATH}/code-snippet-window-curl.html`;
let exposedpath, token, key, exposedmethod,floatingWindowID,floatingWindowHTMLJavaID,floatingWindowHTMLCurlID,attrData,currentFloatingWindow, nodejsData, javaData, curlData,basicToken;


function setExposedPathAndMethod(path, method){
  exposedpath = path;
  exposedmethod = method;
  return;
}

function ifAuthSetAuth(authToken){
  token = authToken;
  return;
}

function ifBasicAuthSetAuth(basicAuthToken){
  basicToken = basicAuthToken;
  return;
}

function ifKeySetKey(apiKey){
  key = apiKey;
  return;
}

async function codeSnippetWindow(element) {
  if(floatingWindowID)  floating_window.hideWindow(floatingWindowID);
  if(floatingWindowHTMLJavaID) floating_window.hideWindow(floatingWindowHTMLJavaID);
  if(floatingWindowHTMLCurlID) floating_window.hideWindow(floatingWindowHTMLCurlID);
 serverDetails = JSON.parse(session.get("__org_server_details"));



    if(element == "NodeJS Client"){
      if(floatingWindowID)  floating_window.hideWindow(floatingWindowID)
      const floatingWindowHTML = await $$.requireText(CONSOLE_HTML_FILE); 
      floatingWindowID =  await floating_window.showWindow("NodeJS", CONSOLE_THEME, Mustache.render(floatingWindowHTML,{}));
      currentFloatingWindow = "nodejs"
      updateData();
    setNodeJSValue();
    }
    else if(element == "Java Client"){
     const floatingWindowHTMLJava  = await $$.requireText(CONSOLE_HTML_JAVA_FILE);
     floatingWindowHTMLJavaID = await floating_window.showWindow("JAVA", CONSOLE_THEME, Mustache.render(floatingWindowHTMLJava, {}));
     currentFloatingWindow = "java";

     updateData();
     setJavaValue();

    }    
    else if(element == "Curl Client"){
      const floatingWindowHTMLCurl = await $$.requireText(CONSOLE_HTML_CURL_FILE);
      floatingWindowHTMLCurlID = await floating_window.showWindow("Curl", CONSOLE_THEME, Mustache.render(floatingWindowHTMLCurl, {}));
      currentFloatingWindow = "curl";
      updateData();
      setShellValue();
    }
  }

function updateData(){
  attrData = api_details.getAttributesData();
      let thisElement = api_details.getHostElementByID("apidetails");
      const shadowRoot = api_details.getShadowRootByHost(thisElement);
      let apikey = shadowRoot.querySelector("input#apikey");
      let jwtToken = shadowRoot.querySelector("input#token-input");
      if(apikey) key = apikey.value; else key = false;
      if(jwtToken) token = jwtToken.value;else token = false;

}

 async function setNodeJSValue(){
  if(document.querySelector(`floating-window`) && floatingWindowID && currentFloatingWindow=="nodejs"){
    let data = ` const httpType = require("${serverDetails.secure?'https':'http'}");
    const options = {
      method: '${exposedmethod}',
      headers: {
         'Content-Type': 'application/json',
         'accept': 'application/json',
         ${token?`'authorization': 'Bearer`:""} ${token?`${token}'`+',':""}
         ${basicToken?`'authorization': 'Basic`:""} ${basicToken?`${basicToken}'`+',':""}
         ${key?"'x-api-key':":""} ${key?`'${key}'`:""}
      }
    }
    const req = httpType.request('${exposedpath}', options, (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
      data += chunk;
     });

    resp.on('end', () => {
      console.log(data);
    });
  });

    req.on('error', (error) => {
      console.error(error);
    });

   req.write(${attrData?`JSON.stringify(${JSON.stringify(attrData)})`:""});

   req.end();`

   

      data =data.replace(/^\s*\n/gm, "");
      nodejsData = data;
      await code_editor.setValue(data,floating_window.getShadowRootByHostId(floatingWindowID).querySelector("code-editor#nodejs"),"javascript");
  }
  }

  async function setJavaValue(){
    if(document.querySelector(`floating-window`) && floatingWindowHTMLJavaID && currentFloatingWindow=="java"){
      let data = `OkHttpClient client = new OkHttpClient();

      MediaType mediaType = MediaType.parse("application/json");
      ${attrData?`RequestBody body = RequestBody.create(mediaType,${attrData?JSON.stringify(attrData,null,4):""});`: ""});
      Request request = new Request.Builder()
        .url('${exposedpath}')
        .post(${exposedmethod})
        .addHeader("accept", "application/json")
        ${token?`.addHeader("'authorization'", "Bearer ${token?token:''}")`:""}
        ${key?`.addHeader("apikey", "${key?key:''}")`:""}

        .build();
      
      Response response = client.newCall(request).execute(); `
  
        data =data.replace(/^\s*\n/gm, "");
        javaData = data;
        await code_editor.setValue(data,floating_window.getShadowRootByHostId(floatingWindowHTMLJavaID).querySelector("code-editor#java"),"java");
    }
    }

    async function setShellValue(){
      if(document.querySelector(`floating-window`) && floatingWindowHTMLCurlID && currentFloatingWindow=="curl"){
        let data = `curl --request ${exposedmethod}  --url ${exposedpath}  --header 'Content-Type: application/json'   ${token?`--header 'authorization: Bearer ${token?token :""}'`:""}   ${key?`--header 'x-api-key:${key?key:""}'`:""} ${basicToken?`--header 'authorization: Basic ${basicToken?basicToken :""}'`:""}  ${attrData?`--data '${attrData?JSON.stringify(attrData):""}'`:""} `
    
          data =data.replace(/^\s*\n/gm, "");
          curlData = data;
          await code_editor.setValue(data,floating_window.getShadowRootByHostId(floatingWindowHTMLCurlID).querySelector("code-editor#curl"),"curl");
      }
      }

   function setAttributeData(data){
    attrData = data;
    setNodeJSValue();
    setJavaValue();
    setShellValue();
  }

  function getValue(mode){
    if(mode == "nodejs") return nodejsData;
    else if(mode == "java") return javaData; 
    else if(mode == "curl") return curlData; 
  }

export const code_snippet_window = {
    trueWebComponentMode: true , codeSnippetWindow, setExposedPathAndMethod, ifAuthSetAuth, ifKeySetKey,ifBasicAuthSetAuth, setNodeJSValue,setAttributeData,setJavaValue,setShellValue, getValue
  }
  
  monkshu_component.register(
    "code-snippet-window",`${COMPONENT_PATH}/code-snippet-window.html`, code_snippet_window
  );