/** 
 * APICL Parser for API400 application.
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

import {serverManager} from "../js/serverManager.js"

let xCounter, yCounter,counter=0,dependencies=[],result = [],storeIDS={},flagNOthenYESelse=0;
let apicl={},initAPICL={},commandCounter = [],nextElseDependency=[];

/**
* Convert the apicl into the final model object
* @param data The incoming apicl to convert, the format should be { "index:" : "command" }
* @returns The  api400modelobject, { "apicl": [{ "commands": finalCommands, "name": "commands", "id": counter }] }
*/

async function apiclParser(data) {
    xCounter = 100;
    yCounter = 80;
    dependencies = [];
    commandCounter = [];
    initAPICL = {};
    storeIDS={};
    apicl = JSON.parse(data);
    initAPICL = _initializeAPICLIndex(JSON.parse(data));
    let modelObject;
    result = [];
    for (let key in apicl) {     
        if (!initAPICL[key]) {
            modelObject = await _parseCommand(apicl[key], counter++, dependencies,key);
            if (Object.keys(modelObject).length>0) { result.push(modelObject); initAPICL[key] = modelObject.id; }
            
        }
    } 
    let resolvedPromises = await Promise.all(result)
    let finalCommands = _correctAPICL(resolvedPromises);
    counter=0;
    return { "apicl": [{ "commands": finalCommands, "name": "commands", "id": counter }] }
}

const _parseCommand = async function (command, counter, dependencies,key) {

    
    let ret = {}, nodeNameAsSubCmd = '', attr;
    let cmd = command.split(' ');
    let nodeName = cmd[0].toLowerCase();
    if (nodeName == "runjs" && _findBetweenParenthesis(command,"MOD") != "") nodeName = "mod";
    if (nodeName == "if") nodeName = "condition";
    if (nodeName == 'chgvar') {
        let nodenameAsSubCmd = await _checkChgvarSubCommand(command);
        nodeNameAsSubCmd = nodenameAsSubCmd.toLowerCase() || nodeName;
    }
    let isThisSubCmd = (nodeNameAsSubCmd) ? true : false;
    nodeName = (nodeNameAsSubCmd) ? nodeNameAsSubCmd : nodeName;
    
    if (nodeName == 'strapi')         { ret= await _parseStrapi(command) }
    else if (nodeName == 'call')       { ret = await _parseCall(command) }
    else if (nodeName == 'runsqlprc')  { ret = await _parseRunsqlprc(command) }
    else if (nodeName == 'runsql')     { ret = await _parseRunsql(command, isThisSubCmd) }
    else if (nodeName == 'runjs')      { ret = await _parseRunjs(command, isThisSubCmd) }
    else if (nodeName == 'log')        { ret= await _parseLog(command) }
    else if (nodeName == 'condition')  { ret = await _parseIfCondition(command,key)}
    else if (nodeName == 'iftrue')     { ret = await _parseIfTrue()}
    else if (nodeName == 'iffalse')    { ret = await _parseIfFalse()}
    else if (nodeName == 'goto')       { ret = await _parseGoto(command)}
    else if (nodeName == 'chgdtaara')  { ret = await _parseChgdtaara(command) }
    else if (nodeName == 'chgvar')     { ret = await _parseChgvar(command) }
    else if (nodeName == 'rtvdtaara')  { ret = await _parseRtvdtaara(command) }
    else if (nodeName == 'qrcvdtaq')   { ret = await _parseQrcvdtaq(command) }
    else if (nodeName == 'qsnddtaq')   { ret = await _parseQsnddtaq(command) }
    else if (nodeName == 'dsppfm')     { ret = await _parseDsppfm(command, isThisSubCmd) }
    else if (nodeName == 'rest')       { ret = await _parseRest(command, isThisSubCmd) }
    else if (nodeName == 'jsonata')    { ret = await _parseJsonata(command, isThisSubCmd) }
    else if (nodeName == 'mod')        { ret = await _parseMod(command) }
    else if (nodeName == 'scr')        { ret = await _parseScr(command, isThisSubCmd,key) }  
    else if (nodeName == 'map')        { ret = await _parseMap(command, isThisSubCmd) }
    else if (nodeName == 'substr')     { ret = await _parseSubstr(command, isThisSubCmd) }
    else if (nodeName == 'sndapimsg')  { ret = await _parseSndapimsg(command) }
    else if (nodeName == 'endapi')     { ret = await _parseEndapi()}
   
    if (ret && ret.nodeName) { attr = await _setAttribute(ret.nodeName,key); }
    return { ...ret, ...attr };
}

/**
 * Convert the apicl command into STRAPI node 
 * STRAPI : Start API
 * @param command  apicl command for STRAPI
 * @returns STRAPI node with all required 
 */

const _parseStrapi= async function (command) {
    let ret = {};
    ret["listbox"] = command.match(/\(([^)]+)\)/) ? JSON.stringify(command.match(/\(([^)]+)\)/)[1].split(" ").filter(Boolean)) : JSON.stringify(['']);
    ret["nodeName"] = "strapi";
    return ret;
};

/**
 * Convert the apicl command into CALL node 
 * CALL : To Call the Program
 * @param command  apicl command for CALL
 * @returns CALL node with all required properties
 */

const _parseCall = async function (command) {
    let ret = {};
    let programName = _findBetweenParenthesis(command,"PGM").split("/");
    ret["libraryname"] = programName[0];
    ret["programname"] = programName[1];  
    ret["listbox"] = JSON.stringify(_findBetweenParenthesis(command,"PARM").split(" ").filter(Boolean));
    ret["nodeName"] = "call";
    return ret;
};

/**
 * Convert the apicl command into RUNSQLPRC node 
 * RUNSQLPRC : Execute the Stored Procedure
 * @param command  apicl command for RUNSQLPRC
 * @returns RUNSQLPRC node with all required properties
 */

const _parseRunsqlprc = async function (command) {
    let ret = {},finalValues=[],paramAtrributes,paramType,otherParams,parameter,paramNature;
    
    let procedureName = _findBetweenParenthesis(command,"PRC").split("/");
    ret["libraryname"] = procedureName[0];
    ret["procedurename"] = procedureName[1];
    let listOfParams =  _findBetweenParenthesis(command,"PARM").split(" ").filter(Boolean);
    for(let param of listOfParams ){
        paramType='',parameter='',paramNature='';
      if(param.includes(":")){
            paramAtrributes=  param.split(":");
            paramType =`:${paramAtrributes[1]}`;
            otherParams = paramAtrributes[0].split("&").filter(Boolean);
            parameter = `&${otherParams[1]}`;
            paramNature= `&${otherParams[0]}` 
      }
      else parameter = param;
      finalValues.push([paramNature,parameter,paramType])
    }
    ret["listbox"] = JSON.stringify(finalValues);
    ret["nodeName"] = "runsqlprc";
    return ret;
};

/**
 * Convert the apicl command into RUNSQL node 
 * RUNSQL : Execute the SQL Query
 * @param command  apicl command for RUNSQL
 * @param isThisSubCmd Contains true or false to check wheather a sub command or not
 * @returns RUNSQL node with all required properties
 */

const _parseRunsql = async function (command, isThisSubCmd) {
    let ret = {};
    let subCmdVar;
    if (isThisSubCmd) {
        // convert it as subcommand
        ret["result"] = _subStrUsingNextIndex(command, "VAR(", ")");
        subCmdVar = _subStrUsingLastIndex(command, "VALUE(", ")")
    }
    subCmdVar = (subCmdVar) ? subCmdVar : command;

    if (subCmdVar.includes("TRIM(TRUE)")) subCmdVar = subCmdVar.replace("TRIM(TRUE)", "");
    if (subCmdVar.includes("BATCH(TRUE)")) subCmdVar = subCmdVar.replace("BATCH(TRUE)", "");
    let sqlObj = _subStrUsingLastIndex(subCmdVar, "SQL(", ")")
    ret["sql"] = sqlObj;
    ret["nodeName"] = "runsql";
    return ret;
};

/**
 * Convert the apicl command into RUNJS node 
 * RUNJS : Execute the Javascript Code
 * @param command  apicl command for RUNJS
 * @param isThisSubCmd Contains true or false to check wheather a sub command or not
 * @returns RUNJS node with all required properties
 */

const _parseRunjs = async function (command, isThisSubCmd) {
    let ret = {};
    let subCmdVar;
    if (isThisSubCmd) {
        // convert it as subcommand
        ret["result"] = _subStrUsingNextIndex(command, "VAR(", ")");
        subCmdVar = _subStrUsingLastIndex(command, "VALUE(", ")");
    }
    subCmdVar = (subCmdVar) ? subCmdVar : command;
    let jsObj = _subStrUsingLastIndex(subCmdVar, "JS(", ")");
    ret["code"] = jsObj;
    ret["nodeName"] = "runjs";
    return ret;
};

/**
 * Convert the apicl command into LOG node 
 * LOG : Log out particular message or variable
 * @param command  apicl command for LOG
 * @returns LOG node with all required properties
 */

const _parseLog = async function (command) {
    let ret = {};
    ret["log"] = _findBetweenParenthesis(command,"MSG");
    ret["nodeName"] = "log";
    return ret;
};

const _parseIfCondition = async function (command,key) {
    let ret = {},afterTrueCmd;
    ret["nodeName"] = "condition";
    ret["condition"] = _findBetweenParenthesis(command,"COND");
    let attr = await _setAttribute("condition");
    result.push({ ...ret, ...attr });
    initAPICL[key] = attr.id; 

    let iftrue='',iffalse='';
    if(command.includes("ELSE")){
        let getThen = command.match(/THEN\(.+\)/)[0].split("ELSE")[0].trim();
        iftrue = _subStrUsingLastIndex(getThen, "THEN(", ")");
        iffalse = _subStrUsingLastIndex(command, "ELSE(", ")");
    }
    else iftrue = _subStrUsingLastIndex(command, "THEN(", ")");

    if (iftrue!='') { 
        result.push(await _parseCommand("iftrue", counter++, dependencies)); 
        afterTrueCmd = await _parseCommand(iftrue.trim(), counter++, dependencies);
        result.push(afterTrueCmd); 
    }
    xCounter=attr.x;
    yCounter=attr.y+80;
    let ModelObjectOfIffalse = await _parseCommand("iffalse", counter++, dependencies);
    ModelObjectOfIffalse.dependencies=[attr.id];

    result.push( ModelObjectOfIffalse); 
    if (iffalse.trim()!='') {  
        result.push(await _parseCommand(iffalse.trim(), counter++, dependencies)); 
    } else {
        nextElseDependency.push(ModelObjectOfIffalse.id);
    }

    // when THEN do not have GOTO and ELSE has GOTO
    if (iftrue.trim().split(" ")[0]!="GOTO" && iffalse.trim().split(" ")[0]=="GOTO" ) {       
        flagNOthenYESelse = afterTrueCmd.id;        
    }

    return {};
};

const _parseIfTrue = async function () {
    return {"nodeName":"iftrue"}
};

const _parseIfFalse = async function () {
    return {"nodeName":"iffalse"}
};

const _parseGoto = async function (command) {
    let ret = {};

    let gotoIndex = command.split(/\s+/)[1];
    if (gotoIndex) {
        ret["nodeName"] = "goto";
        let attr = await _setAttribute("goto");
        if (initAPICL[gotoIndex]!=false) {
            let position = await _findPosition(initAPICL[gotoIndex]);
            result[position].dependencies.push(attr.id);
            result.push({ ...ret, ...attr });
            return;
        }
        result.push({ ...ret, ...attr });
        let i=gotoIndex;
        do {
            let object = await _parseCommand(apicl[i], counter++, dependencies);
            if (object && object.nodeName) { 
                result.push(object); initAPICL[i] = object.id; 
            }
        } while(apicl[i] && apicl[i++]!='ENDAPI');
    }
};

/**
 * Convert the apicl command into CHGDTAARA node 
 * CHGDTAARA : Change Data Area
 * @param command  apicl command for CHGDTAARA
 * @returns CHGDTAARA node with all required properties
 */

const _parseChgdtaara = async function (command) {
    let ret = {};
    let dataAreaName = _findBetweenParenthesis(command,"DTAARA").split("/");
    ret["libraryname"] = dataAreaName[0];
    ret["dataarea"] = dataAreaName[1];
    ret["datatype"] = _findBetweenParenthesis(command, "TYPE") == "*CHAR" ? "Character" : "BigDecimal";
    ret["value"] = _findBetweenParenthesis(command,"VALUE");
    ret["nodeName"] = "chgdtaara"
    return ret;

};

/**
 * Convert the apicl command into CHGVAR node 
 * CHGVAR : Change the Variable
 * @param command  apicl command for CHGVAR
 * @returns CHGVAR node with all required properties
 */
const _parseChgvar = async function (command) {
    let ret = {};
    ret["variable"] =_findBetweenParenthesis(command, "VAR");
    ret["value"] = _findBetweenParenthesis(command, "VALUE");
    ret["nodeName"] = "chgvar"
    return ret;
};

/**
 * Convert the apicl command into RTVDTAARA node 
 * RTVDTAARA : Retrieve Data Area
 * @param command  apicl command for RTVDTAARA
 * @returns RTVDTAARA node with all required properties
 */
const _parseRtvdtaara = async function (command) {
    let ret = {};
    let dataAreaName = _findBetweenParenthesis(command,"DTAARA").split("/");
    ret["libraryname"] = dataAreaName[0];
    ret["dataarea"] = dataAreaName[1];
    ret["datatype"] = _findBetweenParenthesis(command, "TYPE") == "*CHAR" ? "Character" : "BigDecimal";
    ret["value"] = _findBetweenParenthesis(command, "RTNVAR");
    ret["nodeName"] = "rtvdtaara"
    return ret;
};

/**
 * Convert the apicl command into QRCVDTAQ node 
 * QRCVDTAQ : Recieve Data Queue 
 * @param command  apicl command for QRCVDTAQ
 * @returns QRCVDTAQ node with all required properties
 */
const _parseQrcvdtaq = async function (command) {
    let ret = {};
    let qrcvdtaqParm = _findBetweenParenthesis(command,"PARM").split(/\s+/).filter(Boolean);
    ret["libraryname"] = qrcvdtaqParm[0].split("/")[0];
    ret["dataqueue"] = qrcvdtaqParm[0].split("/")[1];
    ret["wait"] = qrcvdtaqParm[1];
    ret["allowpeek"] = qrcvdtaqParm[2] == "true" ? "true" : "false";
    ret["data"] = qrcvdtaqParm[3].includes("&") ? qrcvdtaqParm[3] : qrcvdtaqParm.slice(3).join(" ");
    ret["nodeName"] = "qrcvdtaq"
    return ret;
};

/**
 * Convert the apicl command into QSNDDTAQ node 
 * QSNDDTAQ : Send Data Queue
 * @param command  apicl command for QSNDDTAQ
 * @returns QSNDDTAQ node with all required properties
 */
const _parseQsnddtaq = async function (command) {
    let ret = {};
    let qsnddtaqParm = _findBetweenParenthesis(command, "PARM").split(/\s+/).filter(Boolean);
    ret["libraryname"] = qsnddtaqParm[0].split("/")[0];
    ret["dataqueue"] = qsnddtaqParm[0].split("/")[1];
    ret["value"] = qsnddtaqParm[1].includes("&") ? qsnddtaqParm[1]:qsnddtaqParm.slice(1).join(" ");
    ret["nodeName"] = "qsnddtaq"
    return ret;
};

/**
 * Convert the apicl command into DSPPFM node 
 * DSPPFM : Display Physical File Member
 * @param command  apicl command for DSPPFM
 * @param isThisSubCmd Contains true or false to check wheather a sub command or not
 * @returns DSPPFM node with all required properties
 */

const _parseDsppfm = async function (command, isThisSubCmd) {
    let ret = {};
    let subCmdVar;
    if (isThisSubCmd) {
        // convert it as subcommand
        ret["result"] = _subStrUsingNextIndex(command, "VAR(", ")");
        subCmdVar = _subStrUsingLastIndex(command, "VALUE(", ")");
    }
    let file = _subStrUsingNextIndex(subCmdVar, "FILE(", ")").split('/');
    ret["libraryname"] = file[0];
    ret["physicalfile"] = file[1];
    ret["member"] = _subStrUsingLastIndex(subCmdVar, "MBR(", ")") ? _subStrUsingLastIndex(subCmdVar, "MBR(", ")") : "";
    ret["nodeName"] = "dsppfm"
    return ret;
};

/**
 * Convert the apicl command into REST node 
 * REST : To Call the REST URL
 * @param command  apicl command for REST
 * @param isThisSubCmd Contains true or false to check wheather a sub command or not  
 * @returns REST node with all required properties
 */
const _parseRest = async function (command, isThisSubCmd) {
    let ret = {};
    
    if (isThisSubCmd) {
        ret["result"] = _subStrUsingNextIndex(command, "VAR(", ")");
        command = _subStrUsingLastIndex(command, "VALUE(", ")");
    }
    ret["url"] = _findBetweenParenthesis(command,"URL");
    ret["method"] = _findBetweenParenthesis(command,"METHOD");
    ret["parameter"] = _findBetweenParenthesis(command,"PARM");
    ret["headers"] = _findBetweenParenthesis(command,"HEADERS");
    ret["nodeName"] = "rest";
    return ret;

};

/**
 * Convert the apicl command into JSONATA node 
 * JSONATA : To execute the JSONATA expression
 * @param command  apicl command for JSONATA
 * @param isThisSubCmd Contains true or false to check wheather a sub command or not
 * @returns JSONATA node with all required properties
 */

const _parseJsonata = async function (command, isThisSubCmd) {
    let ret = {};
    let subCmdVar;
    if (isThisSubCmd) {
        // convert it as subcommand
        ret["result"] = _subStrUsingNextIndex(command, "VAR(", ")");
        subCmdVar = _subStrUsingLastIndex(command, "VALUE(", ")");
    }
    ret["jsonata"] = _subStrUsingNextIndex(subCmdVar, "EXPRESSION(", ")");
    ret["nodeName"] = "jsonata";
    return ret;
};

/**
 * Convert the apicl command into RUNJS MOD node 
 * RUNJS MOD : Execute the Javascript Code
 * @param command  apicl command for RUNJS MOD
 * @returns RUNJS MOD node with all required properties
 */

async function _parseMod(command) {
    let ret = {};
    ret["modulename"] = _findBetweenParenthesis(command, "MOD");
    const jsData = await serverManager.getModule(_findBetweenParenthesis(command,"MOD"));
    ret["code"] = jsData.mod;
    ret["nodeName"] = "mod";
    return ret;
   
};

/**
 * Convert the apicl command into the SCR READ node or SCR KEYS or SCR OPS
 * SCR READ : Screen Scrapping Read the coordinates
 * SCR KEYS : Screen Scrapping , hit the command and keys on particular coordinates
 * SCR OPS  : Screen Scrapping , start , release
 * @param command  apicl command for CHGVAR
 * @param isThisSubCmd Contains true or false to check wheather a sub command or not
 * @param key index number of this command
 * @returns CHGVAR node with all required properties
 */


const _parseScr = async function (command, isThisSubCmd,key) {
    let ret = {};
    let subCmdVar, readParams, keysParams;
    if (isThisSubCmd) {
        // convert it as subcommand
        ret["result"] = _subStrUsingNextIndex(command, "VAR(", ")");
        subCmdVar = _subStrUsingLastIndex(command, "VALUE(", ")")
    }
    subCmdVar = (subCmdVar) ? subCmdVar : command;
    ret["session"] = _subStrUsingNextIndex(subCmdVar, "NAME(", ")");
    if (subCmdVar.includes("START")) {
        ret["nodeName"] = "scrops";
        ret["scrops"] = "start";

        if (subCmdVar.includes("KEYS")) {
            let attr;
            if (ret && ret.nodeName) {  attr = await _setAttribute(ret.nodeName,key); }
            result.push({ ...ret, ...attr }); 
            initAPICL[key] = attr.id; 
            
            let cmdAfterRemoveScrStart = command.replace('START','');
            result.push(await _parseCommand(cmdAfterRemoveScrStart, counter++, dependencies));

            return {};
        }

    } else if (subCmdVar.includes("STOP")) {
        ret["nodeName"] = "scrops";
        ret["scrops"] = "stop";
    } else if (subCmdVar.includes("RELEASE")) {
        ret["nodeName"] = "scrops";
        ret["scrops"] = "release";
    } else if (subCmdVar.includes("READ")) {
        let allReads = [];
        let values;
        readParams = _subStrUsingLastIndex(subCmdVar, "READ(", ")");    
        readParams.split(':').forEach(function (value) {
            values = value.trim().split(',')
            for (let j = 0; j < 3; j++) {
                values[j] = values[j] ? values[j].trim() : '';
            }
            allReads.push(values)
        });
        ret["nodeName"] = "scrread";
        ret["listbox"] = JSON.stringify(allReads);
    } else if (subCmdVar.includes("KEYS")) {
        keysParams = _findBetweenParenthesis(subCmdVar,"KEYS");
        
        let allKeys = [];
        let values;
        keysParams.split(':').forEach(function (value) {
            values = value.trim().split(',');
            for (let j = 0; j < 3; j++) {
                values[j] = values[j] ? values[j].trim() : '';
            }
            allKeys.push(values);
        });
        ret["nodeName"] = "scrkeys";
        ret["listbox"] = JSON.stringify(allKeys);
    }

    return ret;
};

/**
 * Convert the apicl command into MAP node 
 * MAP : To Extract the particular String
 * @param command  apicl command for MAP
 * @param isThisSubCmd Contains true or false to check wheather a sub command or not
 * @returns MAP node with all required properties
 */

const _parseMap = async function (command, isThisSubCmd) {
    let ret = {};
    let subCmdVar, maps;
    if (isThisSubCmd) {
        ret["result"] = _subStrUsingNextIndex(command, "VAR(", ")");
        subCmdVar = _subStrUsingLastIndex(command, "VALUE(", ")")
    }
    maps = _subStrUsingLastIndex(subCmdVar, "DO(", ")");
    let fixIndex = 0; let tuples = []; maps.split(",").forEach((tuple,i) => {
        if (tuple.match(/.+?:.+?[:.+?,?]/)) {tuples.push(tuple); fixIndex = i;}
        else tuples[fixIndex] = `${tuples[fixIndex]},${tuple}`;
    });
    let mapArr = [];
    tuples.forEach(function (value) {
        let values = value.trim().split(':');
        for (let j = 0; j < 5; j++) {
            values[j] = values[j] ? values[j].trim() : '';
        }
        mapArr.push(values);
    });
    ret["listbox"] = JSON.stringify(mapArr);
    ret["nodeName"] = "map";
    return ret;

};

/**
 * Convert the apicl command into SUBSTR node 
 * SUBSTR : To Extract out the Substring from a String
 * @param command  apicl command for SUBSTR
 * @param isThisSubCmd Contains true or false to check wheather a sub command or not
 * @returns SUBSTR node with all required properties
 */

const _parseSubstr = async function (command, isThisSubCmd) {

    let ret = {};
    let subCmdVar;
    if (isThisSubCmd) {
        subCmdVar = _subStrUsingLastIndex(command, "VALUE(", ")")
    }
    subCmdVar = (subCmdVar) ? subCmdVar : command;
    let substr = _subStrUsingLastIndex(subCmdVar, "DO(", ")").split(":");
    ret["variable"] = _subStrUsingNextIndex(command, "VAR(", ")");
    ret["string"] = substr[0];
    ret["index"] = substr[1];
    ret["noofchar"] = substr[2];
    ret["nodeName"] = "substr";
    return ret;
}

/**
 * Convert the apicl command into SNDAPIMSG node 
 * SNDAPIMSG : Send API Messages
 * @param command  apicl command for SNDAPIMSG
 * @returns SNDAPIMSG node with all required 
 */
const _parseSndapimsg= async function (command) {
    let ret = {};
    ret["listbox"] = command.match(/\(([^)]+)\)/) ? JSON.stringify(command.match(/\(([^)]+)\)/)[1].split(" ").filter(Boolean)) : JSON.stringify(['']);
    ret["nodeName"] = "sndapimsg";
    return ret;
};

/**
 * Convert the apicl command into ENDAPI node 
 * ENDAPI : To End the API
 * @param command  apicl command for ENDAPI
 * @returns ENDAPI node with all required properties
 */

const _parseEndapi = async function () {
 
    return {"nodeName":"endapi"};
};

/**
 * Sets the attributes such as dependencies, X-coordinates, Y-coordinates, Unique ID to the node.
 * @param nodeName  node name of that command
 *  @param key 
 * @returns an object contains dependencies, X-coordinates, Y-coordinates
 */
const _setAttribute = async function (nodeName,key) {
    let attribute={};
    let description = nodeName.charAt(0).toUpperCase() + nodeName.slice(1).toLowerCase();
    attribute["id"] = _getUniqueID();
    if (description == 'Iftrue'||description == 'Iffalse') {  attribute["description"] = description;
    } else { attribute["description"] = `${description}${_addCommandCount(description)}`;  }
    
    storeIDS[key]=attribute.id
    dependencies.push(attribute.id);
    
    if (counter >= 2) {
        if(xCounter%1200==0 && yCounter%80 == 0){ xCounter=100;yCounter=yCounter+80};
        attribute["dependencies"] = _putDependency(dependencies[counter - 2],nodeName);
        attribute["x"] = xCounter;
        attribute["y"] = yCounter;
        xCounter = xCounter + 100
    }
    return attribute;
};

const _findPosition = async function (id) {

    let pos=0;
    for (pos in result) { if (result[pos].id==id) {  return pos; } }

}

const _addCommandCount = function (command) {
    commandCounter[command] = (commandCounter[command]>=1) ? ++commandCounter[command] : 1; 
    return commandCounter[command];

}

const _initializeAPICLIndex = function (initApicl) {
    for (let key in initApicl) {
        initApicl[key] = false;
    } 
    return initApicl;
}

const _correctAPICL = function (result) {

    let finalAPICL = [];
    for (let key in result) {  if (Object.keys(result[key]).length>0) { finalAPICL.push(result[key]); } }
    return finalAPICL;
}

const _putDependency = function (nodeid,nodeName) {
    
    let dependencyId;
    if (nextElseDependency.length>0) {dependencyId = nextElseDependency[0];  nextElseDependency.pop(); } 
    else { 
        dependencyId = nodeid;
        if (flagNOthenYESelse!=0 && nodeName!='endapi') { dependencyId = flagNOthenYESelse; flagNOthenYESelse=0; }
    }
    
    return [`${dependencyId}`];
};

const _checkChgvarSubCommand = async function (command) {
    let subCommands = ['SCR', 'REST', 'JSONATA', 'DSPPFM', 'MAP', 'SUBSTR', 'RUNSQL', 'RUNJS'];
    let nodeName = "";
    subCommands.forEach((subCommand) => {
        if (command.includes(subCommand)) { nodeName = subCommand; }
    })
    return nodeName;
};

const _subStrUsingLastIndex = function (str, startStr, nextIndex) {
    return str.substring(str.indexOf(startStr) + startStr.length, str.lastIndexOf(nextIndex));
};

const _subStrUsingNextIndex = function (str, startStr, lastIndex) {
    return str.substring(str.indexOf(startStr) + startStr.length, str.indexOf(lastIndex));
};

const _findBetweenParenthesis = function (string,fromWord) {
     
    return string.match(new RegExp(`${fromWord}\\(([^)]+)\\)`)) ? string.match(new RegExp(`${fromWord}\\(([^)]+)\\)`))[1] : "";
}



const _getUniqueID = _ => `${Date.now()}${Math.random() * 100}`;

export const apiclparser = { apiclParser }