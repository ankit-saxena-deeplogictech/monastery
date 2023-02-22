/**
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import { util } from "/framework/js/util.mjs";
import { monkshu_component } from "/framework/js/monkshu_component.mjs";
import { session } from "/framework/js/session.mjs";

const COMPONENT_PATH = util.getModulePath(import.meta);

const elementConnected = async (element) => {
  Object.defineProperty(element, "value", {
    get: (_) => _getValue(element),
    set: (value) => _setValue(value, element)
  });
  let data = {};
  if (element.getAttribute("onclickHandler")) data = { onclick: element.getAttribute("onclickHandler") };

  // In Open from Server , to save the server details in drop-down , till session exists
  if (session.get("__org_api400_server") && !element.getAttribute("list")) {
    let list = [];
    const serverDetails = await session.get("__org_api400_server");
    serverDetails.forEach(detail => list.push({ 'value': detail }));
    data.values = list;
  } else {
    if (element.getAttribute("list")) data.values = JSON.parse(element.getAttribute("list").replace(/'/g, '\"'));
    else element.remove();
  }
  data.text = element.getAttribute("text");
  drop_down.setData(element.id, data);
};

/**
* Element was rendered
* @param element Host element
*/
const elementRendered = async (element) => {
  _attachFormValidationControls(element);
  if (element.getAttribute("value")) _setValue(element.getAttribute("value"), element);
}

function _getValue(element) {
  const shadowRoot = drop_down.getShadowRootByHostId(element.getAttribute("id"));
  const value = shadowRoot.querySelector("select").value;
  return value;
};

function _setValue(value, element) {
  const shadowRoot = drop_down.getShadowRootByHostId(element.getAttribute("id"));
  shadowRoot.querySelector(`#${value}`).setAttribute("selected", "selected");
};

function _attachFormValidationControls(element) {

  const selectElement = drop_down.getShadowRootByHostId(element.getAttribute("id")).querySelector("select#choices");
  element.getValue = _ => selectElement.value;
  element.setValue = v => selectElement.value = v;
  element.getValidity = _ => selectElement.validity;
  element.getWillValidate = _ => selectElement.willValidate;
  element.checkValidity = _ => selectElement.checkValidity();
  element.reportValidity = _ => selectElement.reportValidity();
  element.getValidationMessage = _ => selectElement.validationMessage;
}

export const drop_down = { trueWebComponentMode: true, elementConnected, elementRendered };

monkshu_component.register("drop-down", `${COMPONENT_PATH}/drop-down.html`, drop_down);