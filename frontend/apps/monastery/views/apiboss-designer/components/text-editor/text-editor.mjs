/** 
 * Text editor component
 * (C) 2019 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
 import {util} from "/framework/js/util.mjs";
 import {monkshu_component} from "/framework/js/monkshu_component.mjs";

 const COMPONENT_PATH = util.getModulePath(import.meta), VIEW_PATH=APP_CONSTANTS.CONF_PATH;
 const P3_LIBS = [`${COMPONENT_PATH}/3p/codemirror/lib/codemirror.js`, `${COMPONENT_PATH}/3p/codemirror/addon/selection/active-line.js`,
	 `${COMPONENT_PATH}/3p/codemirror/mode/javascript/javascript.js`, `${COMPONENT_PATH}/3p/codemirror/addon/edit/matchbrackets.js`,
	 `${COMPONENT_PATH}/3p/codemirror/addon/lint/lint.js`, `${COMPONENT_PATH}/3p/codemirror/addon/lint/javascript-lint.js`,
	 `${COMPONENT_PATH}/3p/jshint/jshint.js`,`${COMPONENT_PATH}/3p/codemirror/addon/lint/json-lint.js`,]
 let model;
 async function elementConnected(element) {
	 Object.defineProperty(element, "value", {get: _=>_getValue(element), set: value=>_setValue(value, element)});
	 
	 const data = { componentPath: COMPONENT_PATH, styleBody:element.getAttribute("styleBody")?
		 `<style>${element.getAttribute("styleBody")}</style>`:undefined, 
		 showToolbar:element.getAttribute("showToolbar")?.toLowerCase() == "false"?undefined:true };
 
		model = await $$.requireJSON(`${VIEW_PATH}/metadata.json`);
	 if (element.id) if (!text_editor.datas) {text_editor.datas = {}; text_editor.datas[element.id] = data;} 
	 else text_editor.data = data;
 }
 
 async function elementRendered(element) {
	 for (const p3lib of P3_LIBS) await $$.require(p3lib);	// load all the libs we need
	 setTimeout(_=>{	// apparently we need timeout for CM to load properly
		 const editorElement = text_editor.getShadowRootByHost(element).querySelector("textarea#texteditor");
		 const cm = CodeMirror(cmElement => editorElement.parentNode.replaceChild(cmElement, editorElement), 
			 {lineNumbers:true, gutter:true,  styleActiveLine: true, styleActiveSelected: true,matchBrackets:true,matchTags:true, readOnly: true, className: "readOnly" ,
				 mode: "application/ld+json", lint: {selfContain: true}, gutters: ["CodeMirror-lint-markers"], matchBrackets: true}); 
		 text_editor.getMemoryByHost(element).editor = cm; cm.setSize("100%", "100%"); 
		//  let data = JSON.stringify(jsonData,null,4);
		//   _setValue(data, element);
	 }, 10);
 }

 function updateResponseData() {
	const element = text_editor.getHostElementByID("response");
	const shadowRoot = text_editor.getShadowRootByHost(element);
	shadowRoot.querySelector("div#statuscontainer").style.display = "none";
	_setValue("", element);
  }

  function getJsonData(json){
	let data = JSON.stringify(json, null, 4);
	const element = text_editor.getHostElementByID("response");
	const shadowRoot = text_editor.getShadowRootByHost(element);
	if(json && json.result){
		shadowRoot.querySelector("div#statuscontainer").style.display = "block";
	} else shadowRoot.querySelector("div#statuscontainer").style.display = "none";
	if(json){
		if(json.result) {_setValue(data, element);}
		else {_setValue(`${json.status}: ${json.statusText}`, element); shadowRoot.querySelector("div#statuscontainer").style.display = "block";
				shadowRoot.querySelector("#status").innerText = `${json.status}`; shadowRoot.querySelector("#dot").style.border = "red";
				shadowRoot.querySelector("#dot").style.background = "red";
			};
	} else { let res = {}; _setValue(JSON.stringify(res),element); }
	return;
 }

 function copyToClipboard(){
	const host = text_editor.getHostElementByID("response");
	if(_getValue(host)){
		navigator.clipboard.writeText(_getValue(host));
	}
 }
 
 async function open(element) {
	 try {
		 const jsContents = (await util.uploadAFile("text/javascript")).data;
		 if (jsContents) _setValue(jsContents, text_editor.getHostElement(element));
	 } catch (err) {LOG.error(`Error uploading file, ${err}`);}
 }
 
 async function save(element) {
	 const host = text_editor.getHostElement(element);
	 const jsContents = _getValue(host);
	 util.downloadFile(jsContents, "text/javascript", decodeURIComponent(host.getAttribute("downloadfilename"))||"code.js");
 }
 
 function _getValue(host) {
	 const cm = text_editor.getMemoryByHost(host).editor;
	 const value = cm.getDoc().getValue(); return value;
 }
 
 function _setValue(value, host) {
	 const cm = text_editor.getMemoryByHost(host).editor;
	 cm.getDoc().setValue(value);
 }
 
 // convert this all into a WebComponent so we can use it
 export const text_editor = {trueWebComponentMode: true, elementConnected, elementRendered, open, save ,getJsonData, copyToClipboard, updateResponseData}
 monkshu_component.register("text-editor", `${COMPONENT_PATH}/text-editor.html`, text_editor);