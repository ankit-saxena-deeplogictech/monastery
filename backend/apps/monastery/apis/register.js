/**
 * Registers a new user. 
 * (C) 2015 TekMonks. All rights reserved.
 */
const totp = require(`${APP_CONSTANTS.LIB_DIR}/totp.js`);
const userid = require(`${APP_CONSTANTS.LIB_DIR}/userid.js`);

exports.doService = async jsonReq => {
	if (!validateRequest(jsonReq)) { LOG.error("Validation failure."); return CONSTANTS.FALSE_RESULT; }
	let products = [];
	LOG.debug("Got register request for ID: " + jsonReq.id);

	if (!totp.verifyTOTP(jsonReq.totpSecret, jsonReq.totpCode)) {
		LOG.error(`Unable to register: ${jsonReq.name}, ID: ${jsonReq.id}, wrong totp code`);
		return CONSTANTS.FALSE_RESULT;
	}
	await exports.updateOrgAndDomain(jsonReq);	// set domain and override org if needed
	const domainResults = await exports.checkDomain(jsonReq);
	if (!domainResults) {LOG.error(`Unable to register: ${jsonReq.name}, ID: ${jsonReq.id}, wrong with userid`);return CONSTANTS.FALSE_RESULT;}

	const existingUsersForDomain = await userid.getUsersForDomain(_getRootDomain(jsonReq)),
		existingUsersForOrg = await userid.getUsersForOrg(jsonReq.org),
		notFirstUserForThisDomain = existingUsersForDomain && existingUsersForDomain.result && existingUsersForDomain.users.length,
		notFirstUserForThisOrg = existingUsersForOrg && existingUsersForOrg.result && existingUsersForOrg.users.length,
		approved = notFirstUserForThisOrg || notFirstUserForThisDomain ? 0 : 1,
		role = notFirstUserForThisOrg || notFirstUserForThisDomain ? "user" : "admin";
	LOG.info(JSON.stringify(jsonReq))

	const result = await userid.register(jsonReq.id, jsonReq.name, jsonReq.org, jsonReq.pwph, jsonReq.totpSecret, role,
		approved, jsonReq.domain);

	if (result.result){ 
	LOG.info(`User registered and logged in: ${jsonReq.name}, ID: ${jsonReq.id}`);
	const currentExistingUsersForOrg = await userid.getUsersForOrg(jsonReq.org);
	let org_id;
	const orgResult = await userid.getOrgsMatchingOnName(jsonReq.org);
	if (orgResult.result && orgResult.org_id) org_id = orgResult.org_id;
	if (currentExistingUsersForOrg.result && currentExistingUsersForOrg.users.length > 0) {
		const updateDomainResult = await userid.updateusersDomain(org_id, jsonReq.domain);
		if(!updateDomainResult.result) LOG.error(`Unable to update domain: ${jsonReq.domain}`);
	}

} else LOG.error(`Unable to register: ${jsonReq.name}, ID: ${jsonReq.id} DB error`);



	const result1 = await userid.getProducts();
	if (result1 && result1.products && result1.products.length > 0) for (let product of result1.products) products.push(product.product_name);

	return { result: result.result, "products": products, name: result.name, id: result.id, org: result.org, role: result.role, tokenflag: result.approved ? true : false,domain:result.domain };
}

exports.updateOrgAndDomain = async jsonReq => {
	const rootDomain = _getRootDomain(jsonReq);
	const existingUsersForDomain = await userid.getUsersForDomain(rootDomain);
	if (existingUsersForDomain && existingUsersForDomain.result && existingUsersForDomain.users.length)
		jsonReq.org = (await userid.getOrgForDomain(rootDomain)) || jsonReq.org;	// if this domain already exists, override the org to the existing organization
	jsonReq.domain = rootDomain;
}

exports.checkDomain = async jsonReq => {
	const rootDomain = _getRootDomain(jsonReq);
	const existingUsersForDomain = await userid.getUsersForDomain(rootDomain);
	const existingUsersForOrg = await userid.getUsersForOrg(jsonReq.org);
	if (!(existingUsersForDomain && existingUsersForDomain?.result && existingUsersForDomain?.users.length) && (existingUsersForOrg && existingUsersForOrg?.result && existingUsersForOrg?.users.length)) {
		const domainNameUsedInOrg = existingUsersForOrg.users[0]["domain"];
		const result = _checkDomainAndSubdomain(domainNameUsedInOrg.toLowerCase(), rootDomain.toLowerCase());
		if (result) { jsonReq.domain = result; return true }
		else return false;
	}
	return true;
}


function _checkDomainAndSubdomain(str1, str2) {
	// check if both strings contain a period, indicating a domain or subdomain
	if (str1.includes(".") && str2.includes(".")) {
		// split the strings into an array using the period as a delimiter
		const arr1 = str1.split(".");
		const arr2 = str2.split(".");
		// check the length of the arrays to determine which string is the domain and which is the subdomain
		if (arr1.length > arr2.length) {
			if (str1.endsWith(str2)) {
				return str2;
			}
		}
		else if (arr2.length > arr1.length) {
			if (str2.endsWith(str1)) { return str1; }
		}
		else return false

	} else return false;
}


function _getRootDomain(jsonReq) {
	const domain = jsonReq.id.indexOf("@") != -1 ? jsonReq.id.substring(jsonReq.id.indexOf("@") + 1) : "undefined"
	return domain;
}


const validateRequest = jsonReq => (jsonReq && jsonReq.pwph && jsonReq.id && jsonReq.name && jsonReq.org && jsonReq.totpSecret && jsonReq.totpCode);
