/**
 *
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import { monkshu_component } from "/framework/js/monkshu_component.mjs";
import { util } from "/framework/js/util.mjs";
import { dialog_box } from "../../../shared/components/dialog-box/dialog-box.mjs";

const COMPONENT_PATH = util.getModulePath(import.meta), DIALOG_HOST_ID = "__org_monkshu_dialog_box",
      textBoxComponent = window.monkshu_env.components['text-box'];

/**
 * Element was rendered
 * @param element Host element
 */
async function elementRendered(element) {
  const elementType = element.getAttribute("type");
  Object.defineProperty(element, "value", { get: (_) => _getValue(element, elementType), 
                    set: (value) => _setValue(value, elementType) });
  if (element.getAttribute("value")) {
    const values = JSON.parse(element.getAttribute("value"));
    if (values && values.length) _setValue(values, elementType);
  } 
  else _setUpDefaultBoxOrContainerBox(elementType); 
}

function _getValue(host, type) {
  const shadowRoot = dialog_box.getShadowRootByContainedElement(host);
  const textBoxContainer = shadowRoot.querySelector("#page-contents");
  return _getTextBoxValues(textBoxContainer, shadowRoot, type);
}

function _setValue(values, type) {
  
  if (type == "Map") for (const textBoxValues of values) textBoxComponent.addTextBoxesForMap(textBoxValues);
  else if (type == "Keys") for (const textBoxValues of values) textBoxComponent.addTextBoxesForScrKeys(textBoxValues);
  else if (type == "Read") for (const textBoxValues of values) textBoxComponent.addTextBoxesForScrRead(textBoxValues);
  else if (type == "runsqlprc") for (const textBoxValue of values) textBoxComponent.addContainerForRunsqlprc(textBoxValue[0], textBoxValue[1], textBoxValue[2]);
  else for (const textBoxValue of values) if (textBoxValue != '') textBoxComponent.addTextBox(type,"false", textBoxValue);

  _setUpDefaultBoxOrContainerBox(elementType); 
}

function _getTextBoxValues(textBoxContainer, shadowRoot, type) {
  const textBoxValues = [];
  if (type == "Map" || type == "Keys" || type == "Read" || type == "runsqlprc") {
    for (const divBox of textBoxContainer.children) {
      const Values = [];
      for (const textBox of divBox.children) Values.push(shadowRoot.querySelector(`#${textBox.getAttribute("id")}`).value.trim());
      textBoxValues.push(Values);
    }
  }
  else for (const textBox of textBoxContainer.children) textBoxValues.push(shadowRoot.querySelector(`#${textBox.getAttribute("id")}`).value.trim());
  return JSON.stringify(textBoxValues);
}

function _setUpDefaultBoxOrContainerBox(elementType) {
  const dialogShadowRoot = dialog_box.getShadowRootByHostId(DIALOG_HOST_ID),
        parentContainer = dialogShadowRoot.querySelector("div#page-contents"),
        noOfElements = parentContainer.children.length;
  if (noOfElements < 1) {
    if (elementType == "Parameter") textBoxComponent.addTextBox(elementType,"false");
    else if (elementType == "callParam") textBoxComponent.addTextBox("Parameter","true");
    else if (elementType == "Message") textBoxComponent.addTextBox(elementType,"false");
    else if (elementType == "Map") textBoxComponent.addTextBoxesForMap();
    else if (elementType == "Keys") textBoxComponent.addTextBoxesForScrKeys();
    else if (elementType == "Read") textBoxComponent.addTextBoxesForScrRead();
    else if (elementType == "runsqlprc") textBoxComponent.addContainerForRunsqlprc();  
  }
}

export const list_box = { trueWebComponentMode: false, elementRendered };
monkshu_component.register("list-box",`${COMPONENT_PATH}/list-box.html`,list_box);