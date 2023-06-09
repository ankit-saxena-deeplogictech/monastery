/**
 *
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import { monkshu_component } from "/framework/js/monkshu_component.mjs";
import { util } from "/framework/js/util.mjs";
import { dialog_box } from "../../../shared/components/dialog-box/dialog-box.mjs";
import { i18n } from "/framework/js/i18n.mjs";

const COMPONENT_PATH = util.getModulePath(import.meta), DIALOG_HOST_ID = "__org_monkshu_dialog_box";

const elementConnected = async (element) => {
  const elementType = element.getAttribute("type");
  Object.defineProperty(element, "value", {
    get: (_) => _getValue(element, elementType),
    set: (value) => _setValue(value, elementType, element)
  });
  const data = {
    text: element.getAttribute("text"), onclick: element.getAttribute("onclickHandler"),
    onclickRemoveHandler: element.getAttribute("onclickRemoveHandler"), componentPath: COMPONENT_PATH,
    styleBody: element.getAttribute("styleBody") ? `<style>${element.getAttribute("styleBody")}</style>`
      : undefined
  };
  list_box.setData(element.id, data);
};

/**
 * Element was rendered
 * @param element Host element
 */
async function elementRendered(element) {
  const elementType = element.getAttribute("type");
  if (element.getAttribute("value")) {
    const values = JSON.parse(element.getAttribute("value"));
    if (values && values.length) _setValue(values, elementType, element);
  }
  else _setUpDefaultBoxOrContainerBox(elementType, element);
}

function _getValue(host, type) {
  const shadowRoot = dialog_box.getShadowRootByContainedElement(host);
  const textBoxContainer = shadowRoot.querySelector("#page-contents");
  return _getTextBoxValues(textBoxContainer, shadowRoot, type);
}

function _setValue(values, type, element) {

  if (type == "map" || type == "keys" || type == "read") for (const textBoxValues of values) addMultipleTextBoxes(element, textBoxValues)
  else if (type == "runsqlprc") for (const textBoxValue of values) addContainerForRunsqlprc(textBoxValue[1], textBoxValue[0], textBoxValue[2]);
  else for (const textBoxValue of values) if (textBoxValue != '') addTextBox(element, textBoxValue);

  _setUpDefaultBoxOrContainerBox(type, element);
}

function _getTextBoxValues(textBoxContainer, shadowRoot, type) {
  const textBoxValues = [];
  if (type == "map" || type == "keys" || type == "read" || type == "runsqlprc") {
    for (const divBox of textBoxContainer.children) {
      const Values = [];
      for (const textBox of divBox.children) Values.push(shadowRoot.querySelector(`#${textBox.getAttribute("id")}`).value.trim());
      textBoxValues.push(Values);
    }
  }
  else for (const textBox of textBoxContainer.children) textBoxValues.push(shadowRoot.querySelector(`#${textBox.getAttribute("id")}`).value.trim());
  return JSON.stringify(textBoxValues);
}

function _setUpDefaultBoxOrContainerBox(elementType, element) {
  const dialogShadowRoot = dialog_box.getShadowRootByHostId(DIALOG_HOST_ID),
    parentContainer = dialogShadowRoot.querySelector("div#page-contents"),
    noOfElements = parentContainer.children.length;
  if (noOfElements < 1) {
    if (elementType == "parameter" || elementType == "message" || elementType == "callParam") addTextBox(element);
    else if (elementType == "map" || elementType == "keys" || elementType == "read") addMultipleTextBoxes(element);
    else if (elementType == "runsqlprc") addContainerForRunsqlprc();
  }
}

function removeElement()  {  //Removes the last element in the page-contents container
  const dialogShadowRoot = dialog_box.getShadowRootByHostId(DIALOG_HOST_ID),
        parent = dialogShadowRoot.querySelector("div#page-contents"),
        noOfElements = parent.children.length;
  if (noOfElements <= 1) return;
  parent.removeChild(parent.lastChild);
}

/**
 * Adds single text box 
 * @param element Host element
 * @param value value inside text box
 */
function addTextBox(element, value) {
  const listBoxElement = list_box.getHostElement(element),
        parentContainer = _getParentContainer(), 
        inputElement = _createElement(parentContainer, listBoxElement.getAttribute("id"), value, 
                                      listBoxElement.getAttribute("placeHolder"), "text-box", "dynamic", "text", 
                                      listBoxElement.getAttribute("required"));
  parentContainer.appendChild(inputElement);
}
/**
 * Adds multiple text boxes container
 * @param element Host element
 * @param textBoxValues contains values of text boxes
 */
function addMultipleTextBoxes(element, textBoxValues) {
  const listBoxElement = list_box.getHostElement(element),
        parentContainer = _getParentContainer(),
    divElement = _createDivElement(parentContainer, _getAttribute(listBoxElement, "idArray"), _getAttribute(listBoxElement, "placeHolderArray"), _getAttribute(listBoxElement, "classNameArray"),
      _getAttribute(listBoxElement, "placeHolderTypeArray"), listBoxElement.getAttribute("classNameForDiv"), _getAttribute(listBoxElement, "valueType"), _getAttribute(listBoxElement, "required"),
      textBoxValues);
  parentContainer.appendChild(divElement);
};

function _getAttribute(element, type) {
  if (type != "classNameForDiv") return JSON.parse(element.getAttribute(type).replace(/'/g, '"'));
}

/**
 * Adds one text box and two drop-down elements to the div container
 * @param variable value of variable text box
 * @param natureOfParm value of natureOfParm  drop-down
 * @param typeOfParam value of typeOfParam drop-down
 */
function addContainerForRunsqlprc(variable, natureOfParm, typeOfParam) {
  const parentContainer = _getParentContainer(), 
        divElement = _createDivElementForRunsqlPrc(parentContainer, variable, natureOfParm, typeOfParam);
  parentContainer.appendChild(divElement);
};

function _createElement(parentContainer, id, value, placeHolder, className, placeHolderType, type, required) {
  const inputElement = document.createElement("input");
  inputElement.setAttribute("type", `${type}`);

  if (type == "text") {
    inputElement.setAttribute("oninvalid", `this.setCustomValidity(${i18n.get('FillField')})`)
    inputElement.setAttribute("oninput", "setCustomValidity('')");
  }
  if (type == "number") {
    inputElement.setAttribute("oninvalid", `this.setCustomValidity(${i18n.get('FillNum')})`);
    inputElement.setAttribute("oninput", "setCustomValidity('')");
  }
  inputElement.setAttribute("id", `${id}-${parentContainer.children.length + 1}`);
  
  if (placeHolderType == "static") inputElement.setAttribute("placeholder", placeHolder);
  else inputElement.setAttribute("placeholder", `${placeHolder}-${parentContainer.children.length + 1}`);

  if (value != undefined) inputElement.setAttribute("value", `${value}`);
  if (required == "true") inputElement.setAttribute("required", true);
  if (className != undefined) inputElement.setAttribute("class", `${className} validate`);
  return inputElement;
};

function _getParentContainer() {
  const dialogShadowRoot = dialog_box.getShadowRootByHostId(DIALOG_HOST_ID),
        parentContainer = dialogShadowRoot.querySelector("div#page-contents");
  return parentContainer;
}

function _createDivElement(parentContainer, idArray, placeHolderArray, classNameArray, placeHolderTypeArray, classNameForDiv, valueType, required, textBoxValues) {
  const divElement = document.createElement("div");
  divElement.setAttribute("class", classNameForDiv);
  for (let i = 0; i < idArray.length; i++) {
    let inputElement;
    if (textBoxValues != undefined) inputElement = _createElement(parentContainer, idArray[i], textBoxValues[i], placeHolderArray[i], classNameArray[i], placeHolderTypeArray[i], valueType[i], required[i]);
    else inputElement = _createElement(parentContainer, idArray[i], textBoxValues, placeHolderArray[i], classNameArray[i], placeHolderTypeArray[i], valueType[i], required[i]);
    divElement.append(inputElement);
  }
  return divElement;
}

function _createDivElementForRunsqlPrc(parentContainer, variable, natureOfParm, typeOfParam) {
  const divElement = document.createElement("div");
  divElement.setAttribute("class", 'runsqlprc');
  const inputElement1 = _createElement(parentContainer, "variable", variable, "Variable", "variablebox", "dynamic", "text", "true"),
    selectElement1 = _createDropDownElement(parentContainer, "nature"),
    selectElement2 = _createDropDownElement(parentContainer, "type");
  divElement.append(selectElement1, inputElement1, selectElement2);

  if (natureOfParm != undefined) {
    for (let i = 0; i < selectElement1.options.length; ++i)  if (selectElement1.options[i].text == natureOfParm.slice(1))
      selectElement1.options[i].selected = true;
  }
  if (typeOfParam != undefined) {
    for (let i = 0; i < selectElement2.options.length; ++i) if (selectElement2.options[i].text == typeOfParam.slice(1))
      selectElement2.options[i].selected = true;
  }
  return divElement;
}

function _createDropDownElement(parentContainer, type) {
  const selectElement = document.createElement("select");
  if (type == "nature") selectElement.innerHTML = ' <option value="" selected   >Nature Of Param</option> <option value="&IN">IN</option><option value="&OUT">OUT</option><option value="&INOUT">INOUT</option>';
  else selectElement.innerHTML = ' <option value="" selected  >Type Of Param </option> <option value=":NUM">NUM</option><option value=":CHAR">CHAR</option>';
  selectElement.setAttribute("id", `${type}-${parentContainer.children.length + 1}`);
  selectElement.setAttribute("class", type);
  return selectElement;
}

export const list_box = { trueWebComponentMode: false, elementConnected, elementRendered, removeElement, 
        addMultipleTextBoxes, addTextBox, addContainerForRunsqlprc };
monkshu_component.register("list-box", `${COMPONENT_PATH}/list-box.html`, list_box);