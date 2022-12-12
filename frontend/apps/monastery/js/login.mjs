/**
 * For login.html file
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import { application } from "./application.mjs";
import { loginmanager } from "./loginmanager.mjs";

async function signin(id, pw, shadowRoot) {
	if (!_validateForm(shadowRoot)) return;	// HTML5 validation failed
	if (await loginmanager.signin(id, pw)) application.loggedIn();
	else document.querySelector("span#error").style.display = "inline";
}

function _validateForm(shadowRoot) {
	const userid = document.querySelector("input#id");
	if (!userid.checkValidity()) { userid.reportValidity(); return false; }
	if (!shadowRoot.checkValidity()) { shadowRoot.reportValidity(); return false; }
	return true;
}

export const login = { signin };