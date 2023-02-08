/** 
 * (C) 2021 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import {util} from "/framework/js/util.mjs";
import {monkshu_component} from "/framework/js/monkshu_component.mjs";
import { input_output_fields } from "../../../apiboss-designer/components/input-output-fields/input-output-fields.mjs";
import { dialog_box } from "../dialog-box/dialog-box.mjs";
import { input_table } from "../../../apiboss-designer/components/input-table/input-table.mjs";
import { drop_down } from "../../../apiboss-designer/components/drop-down/drop-down.mjs";


const COMPONENT_PATH = util.getModulePath(import.meta);

const elementConnected = async element => {
    const data = {img: element.getAttribute("img"), text: element.getAttribute("text"), 
		onclick: element.getAttribute("onclickHandler"), alt: element.getAttribute("alt"), title: element.getAttribute("title"),
		styleBody: element.getAttribute("styleBody")?`<style>${element.getAttribute("styleBody")}</style>`:undefined,
		column: element.getAttribute("type")=="column"?true:undefined, row: element.getAttribute("type")=="row"?true:undefined,
		color: element.getAttribute("color"), "background-color": element.getAttribute("background-color"), 
		"active-background-color": element.getAttribute("active-background-color"), border: element.getAttribute("border")
	};

	image_button.setData(element.id, data);
}

async function uploadOpenAPI(element, event) {
	let data = await util.uploadAFile("application/json");
	data = JSON.parse(data.data);
	let dialoghost = dialog_box.getHostElementByID("__org_monkshu_dialog_box");
	let dialogShadow = dialog_box.getShadowRootByHost(dialoghost);
	let input_output = input_output_fields.getHostElementByID("input-output");
	const shadowRoot_inputOuput = input_output_fields.getShadowRootByHost(input_output);
	dialogShadow.querySelector("#apiname").value = data.info.title; 
	dialogShadow.querySelector("#apidescription").value = data.info.description; 

    let path, method, injected=[], passthru=[];
    for(let property in data.paths) { path = property; break; }
    for(let property in data.paths[`${path}`]) { method = property; break; }

    let parameterArray = data.paths[`${path}`][`${method}`]["parameters"];
    for(let items of parameterArray) {
	    if(items.in == "passthrough") {
		passthru.push([items.name]);
	    } else if (items.in == "headers") {
		    injected.push([items.name, ""]);
	    }
    }
    let passthroughHost = input_table.getHostElementByID("passthrough");
    const injectedHost = input_table.getHostElementByID("injected");
    input_table._setValue(JSON.stringify(passthru), passthroughHost);
    input_table._setValue(JSON.stringify(injected), injectedHost);
    let exposedDropDown = drop_down.getHostElementByID("exposedmethod");
    drop_down._setValue(method.toUpperCase(), exposedDropDown);
    let backendMethodDropDown = drop_down.getHostElementByID("backendurlmethod");
    let backendMethod = data.paths[`${path}`][`${method}`]["backend"]["method"];
    drop_down._setValue(backendMethod.toUpperCase(), backendMethodDropDown);
    dialogShadow.querySelector("#exposedpath").value = path;
    dialogShadow.querySelector("#backendurl").value = data.paths[`${path}`][`${method}`]["backend"]["url"];
    let arr = [JSON.stringify({requestBody: data.paths[`${path}`][`${method}`]["requestBody"]}), JSON.stringify({responses: data.paths[`${path}`][`${method}`]["responses"]})]
	input_output_fields.create(JSON.parse(arr[0]), shadowRoot_inputOuput.querySelector("#newTree"));
	input_output_fields.create(JSON.parse(arr[1]), shadowRoot_inputOuput.querySelector("#output-childTree"));
	return data;
}

// convert this all into a WebComponent so we can use it
export const image_button = {trueWebComponentMode: true, elementConnected, uploadOpenAPI}
monkshu_component.register("image-button", `${COMPONENT_PATH}/image-button.html`, image_button);