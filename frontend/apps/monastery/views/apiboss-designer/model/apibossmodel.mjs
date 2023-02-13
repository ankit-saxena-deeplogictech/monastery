/** 
 * Model file for API400 application.
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import { algos } from "./algos.mjs";
import { util } from "/framework/js/util.mjs";
import { blackboard } from "/framework/js/blackboard.mjs";

const EMPTY_MODEL = { apis: [], policies: [] }, DEFAULT_BUNDLE = "apis";
let apibossmodelObj = EMPTY_MODEL, idCache = {}, current_command_bundle = DEFAULT_BUNDLE;
const MSG_NODES_MODIFIED = "NODES_MODIFIED", MSG_CONNECTORS_MODIFIED = "CONNECTORS_MODIFIED",
    MSG_NODE_DESCRIPTION_CHANGED = "NODE_DESCRIPTION_CHANGED", MSG_ARE_NODES_CONNECTABLE = "ARE_NODES_CONNECTABLE",
    MSG_GET_MODEL = "GET_MODEL", MSG_RESET = "RESET", MSG_LOAD_MODEL = "LOAD_MODEL",
    MSG_CONNECT_NODES = "CONNECT_NODES", MSG_ADD_NODE = "ADD_NODE";

function init() {
    blackboard.registerListener(MSG_NODES_MODIFIED, message => modelNodesModified(message.type, message.nodeName,
        message.id, message.properties), true);
    blackboard.registerListener(MSG_CONNECTORS_MODIFIED, message => {
        modelConnectorsModified(message.type,
            message.sourceNode, message.targetNode, message.sourceID, message.targetID)
    });
    blackboard.registerListener(MSG_NODE_DESCRIPTION_CHANGED, message => nodeDescriptionChanged(message.nodeName,
        message.id, message.description));
    blackboard.registerListener(MSG_ARE_NODES_CONNECTABLE, message => isConnectable(message.sourceName,
        message.targetName, message.sourceID, message.targetID), true);
    blackboard.registerListener(MSG_GET_MODEL, message => getModelAsFile(message.name), true);
    blackboard.registerListener(MSG_RESET, _ => { apibossmodelObj = EMPTY_MODEL, idCache = {}, current_command_bundle = DEFAULT_BUNDLE; }, true);
    blackboard.registerListener(MSG_LOAD_MODEL, message => loadModel(message.data));
}

function loadModel(jsonModel) {
    try {
        apibossmodelObj = JSON.parse(jsonModel);
    }
    catch (err) { LOG.error(`Bad APIBOSS model, error ${err}, skipping.`); return; }
    if (!(apibossmodelObj.apis)) { LOG.error(`Bad APIBOSS model, not in right format.`); return; }

    // first add all the commands
    for (const nodes in apibossmodelObj) for (const node of apibossmodelObj[nodes] ) {
        const id = node.id || _getUniqueID(); idCache[id] = node; const clone = util.clone(node);
        const nodeName = clone.nodeName;
        blackboard.broadcastMessage(MSG_ADD_NODE, { nodeName, id, description: clone.description, properties: { ...clone }, connectable: true });
    }


    const connectNodes = (sourceID, targetID) => {
        if ((!idCache[sourceID]) || (!idCache[targetID])) { LOG.error(`Bad dependency in the model ${sourceID}, skipping.`); return; }
        const sourceName = idCache[sourceID].nodeName, targetName = idCache[targetID].nodeName;
        blackboard.broadcastMessage(MSG_CONNECT_NODES, { sourceName, targetName, sourceID, targetID });
    }
    // add connections between commands
    for (const api of apibossmodelObj.apis)
        if (api.dependencies) for (const dependency of api.dependencies) connectNodes(dependency, api.id);

}

function modelNodesModified(type, nodeName, id, properties) {

    if (type == apibossmodel.ADDED) return _nodeAdded(nodeName, id, properties);
    if (type == apibossmodel.REMOVED) return _nodeRemoved(nodeName, id);
    if (type == apibossmodel.MODIFIED) return _nodeModified(nodeName, id, properties);
    return false;   // unknown modification
}

function modelConnectorsModified(type, sourceName, targetName, sourceID, targetID) {
    if ((!idCache[sourceID]) || (!idCache[targetID])) return;   // not connected

    const addOrRemoveDependencies = (sourceNode, targetNode, type) => {

        if (type == apibossmodel.ADDED) {
            if (!targetNode.dependencies) targetNode.dependencies = [];
            targetNode.dependencies.push(sourceNode.id);
        } else if (type == apibossmodel.REMOVED && targetNode) {
            const dependencies = targetNode.dependencies;
            if ((!dependencies) || (!dependencies.length) || dependencies.indexOf(sourceNode.id) == -1) return;
            else _arrayDelete(dependencies, sourceNode.id);
            if (dependencies.length == 0) delete targetNode.dependencies;    // no longer required
        }
    }

    addOrRemoveDependencies(idCache[sourceID], idCache[targetID], type);    // also visually connect the nodes  
}

function isConnectable(sourceName, targetName, sourceID, targetID) {    // are these nodes connectable
    if (sourceID == targetID) return false;
    if (targetName == "policy") return false;
    if (sourceName == targetName) return false;

    return true;
}

function nodeDescriptionChanged(_nodeName, id, description) {

    if (!idCache[id]) return;

    const oldNameTracksDescription = _getNameFromDescription(idCache[id].description) == idCache[id].name;
    if (idCache[id].name && oldNameTracksDescription) {
        idCache[id].name = _getNameFromDescription(description); idCache[id].description = description;
    } else idCache[id].description = description;

}

function getModel() {
    const retModel = util.clone(apibossmodelObj);
    return retModel;

}

function getparsedData() {
    let parsedData = {},finalData = [], rateLimit = {}, inputoutput = {}, apiregistrydata = {};
    const retModel = util.clone(apibossmodelObj);
    // console.log(retModel);
    for (const policy of retModel.policies){
        // console.log(policy);
        if(policy.apikey!=""){
            // console.log(policy.apikey);
         if(policy.israteenforcementneeded!="NO") parsedData["ratelimitsdata"]= _ratelimits(policy);
         else parsedData["ratelimitsdata"]="";
        //  finalData.push({[policy.apikey]:parsedData});
            rateLimit[policy.apikey] = parsedData.ratelimitsdata;
        }
    }
    finalData.push({rateLimit: rateLimit});
    parsedData = {};
    for (const api of retModel.apis) {
        parsedData["inputdata"] = JSON.parse(JSON.parse(api["input-output"])[0]);
        parsedData["outputdata"] = JSON.parse(JSON.parse(api["input-output"])[1]);
        inputoutput[api.exposedpath] = parsedData;
    }
    finalData.push({inputoutput: inputoutput});
    let i = 0;
    for(const api of retModel.apis) {
        parsedData = {};
        if(JSON.parse(api.passthrough).length){
            let passthroughHeader = JSON.parse(api.passthrough);
            let passthrough = ''
            for(let item of passthroughHeader) {
                if(item == passthroughHeader[passthroughHeader.length-1]){
                    passthrough+=item[0];
                } else {
                    passthrough+= item[0]+',';
                }
            }
            parsedData["passthrough"] = passthrough;
        }

        if(JSON.parse(api.injected).length){
            let injectedHeader = JSON.parse(api.injected);
            let injected = {};
            for(let item of injectedHeader) {
                injected[item[0]] = item[1];
            }
            parsedData["injected"] = injected;
        }

        parsedData["exposedpath"] = api.exposedpath;
        parsedData["backendurl"] = api.backendurl;
        parsedData["backendurlmethod"] = api.backendurlmethod;
        parsedData["isrestapi"] = api.isrestapi;
        parsedData["customContentType"] = api.contentinput;
        // for(const policy of retModel.policies) {
            parsedData["apikey"] = retModel.policies[i].apikey;
            parsedData["needsBasicAuth"] = retModel.policies[i].isauthenticationneeded;
            parsedData["needsToken"] = retModel.policies[i].isjwttokenneeded;
            parsedData["jwtsubject"] = retModel.policies[i].jwtsubject;
            parsedData["addsToken"] = retModel.policies[i].istokenneeded;
            parsedData["tokensubject"] = retModel.policies[i].tokensubject;
            i++;
        // }
        apiregistrydata[api.exposedpath] = parsedData;
    }
    
    finalData.push({ apiregistrydata: apiregistrydata });
    console.log(finalData);
    return finalData;
}


function _ratelimits(policy) {
    if(policy.isauthenticationneeded == "YES") {
        return {  "persec": policy.persec,  "permin": policy.permin,  "perhour": policy.perhour,"perday": policy.perday, "permonth": policy.permonth,   "peryear": policy.peryear, "userid": policy.userid, "password": policy.password };
    }
    return {  "persec": policy.persec,  "permin": policy.permin,  "perhour": policy.perhour,"perday": policy.perday, "permonth": policy.permonth,   "peryear": policy.peryear };
}


const getModelAsFile = name => { return { data: JSON.stringify(getModel(), null, 4), mime: "application/json", filename: `${name || "api400api"}.apiboss` } }

const _getUniqueID = _ => `${Date.now()}${Math.random() * 100}`;


function _nodeAdded(nodeName, id, properties) {
    const node = idCache[id] ? idCache[id] : JSON.parse(JSON.stringify(properties)); node.nodeName = nodeName;
    if (idCache[id]) { _nodeModified(nodeName, id, properties); return; }  // node properties modified
    const name = _getNameFromDescription(node.description);
    node.name = name;
    if (nodeName == "api") { apibossmodelObj.apis.push(node); }
    else if (nodeName == "policy") { apibossmodelObj.policies.push(node); }
    node.id = id; idCache[id] = node;   // transfer ID and cache the node
    return true;
}

function _nodeRemoved(nodeName, id) {
    if (!idCache[id]) return;   // we don't know of this node
    const node = idCache[id];
    if (nodeName == "api") _arrayDelete(apibossmodelObj.apis, node);
    else if (nodeName == "policy") _arrayDelete(apibossmodelObj.policies, node);
    delete idCache[id]; // uncache
    return true;
}

function _nodeModified(nodeName, id, properties) {

    if (!idCache[id]) return false; // we don't know of this node
    for (const key in properties) { // transfer the new properties
        idCache[id][key] = properties[key];
    }
    return true;
}

const _arrayDelete = (array, element) => {
    if (array.includes(element)) array.splice(array.indexOf(element), 1); return element;
}

const _getNameFromDescription = description => description.split(" ")[0].split("\n")[0];

export const apibossmodel = {
    init, loadModel, modelNodesModified, modelConnectorsModified, isConnectable,
    nodeDescriptionChanged, getModelAsFile, getModel,getparsedData,  ADDED: "added", REMOVED: "removed", MODIFIED: "modified"
};
