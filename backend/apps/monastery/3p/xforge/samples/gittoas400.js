/*
 * XForge sample remote command script
 */

const https = require('https');
const fs = require('fs');
const ftp = require("basic-ftp");
const path = require("path");
const { ssh_cmd } = require(`${CONSTANTS.EXTDIR}/ssh_cmd.js`);


const temp_file = `t_${Date.now()}`;
let fileToDownload = '';
const as400conf = { host: "tekmonks.rzkh.de", user: "RVKAPOOR", pass: "DLT4TKM$" }
var gitFileDetails = [
	{
		file: `${temp_file}.json`,
		url: "https://raw.githubusercontent.com/ankit-saxena-deeplogictech/as400rpg/main/first.json"
	}
];

// build
exports.make = async function (host, user, password, hostkey, scriptPath) {

	try {
		console.log("make export function");
		gitFileDetails.forEach(function (item) {
			fileToDownload = item.file;
			_checkOutGitFile(fileToDownload, item.url);
		})
	} catch (err) {
		return CONSTANTS.HANDLE_BUILD_ERROR(`Build failed with remote exit code: ${err.exitCode}, due to error: ${err.stderr}`);
	}
}


const _checkOutGitFile = (file, url) => {
	console.log("Checkout");

	let localFile = fs.createWriteStream(file);
	return new Promise((resolve, reject) => {
		const req = https.get(url, (res) => {
			res.setEncoding('utf8');
			let responseBody = '';
			var len = parseInt(res.headers['content-length'], 10);
			var cur = 0;
			var total = len / 1048576; //1048576 - bytes in 1 Megabyte
			res.on('data', (chunk) => {
				responseBody += chunk;
				_showProgress(file, cur, len, total);
			});

			res.on('end', () => {
				resolve(JSON.parse(responseBody));
				// 2. upload this on as400 using ftp
				if (fs.existsSync(fileToDownload)) {
					console.log('yes file exists , now uploading...');
					_uploadOnAS400(fileToDownload, fileToDownload);

				} else {
					console.log('no exists');
				}
			});
			res.pipe(localFile);
		});

		req.on('error', (err) => {
			reject(err);
		});


	});
}



function _showProgress(file, cur, len, total) {
	console.log("progress");
	console.log("Downloading " + file + " - " + (100.0 * cur / len).toFixed(2)
		+ "% (" + (cur / 1048576).toFixed(2) + " MB) of total size: "
		+ total.toFixed(2) + " MB");
}



async function _uploadOnAS400(localFile, remotePath) {
	console.log("upload on as400");
	const client = new ftp.Client()
	try {
		await client.access({
			host: as400conf.host,
			user: as400conf.user,
			password: as400conf.pass,
			secure: false
		})
		console.log(`localFile : ${localFile}`)
		console.log(`remotePath : ${remotePath}`)
		let result = await client.uploadFrom(localFile, `/home/RVKAPOOR/t.json`)
		console.log(`[Uploading Result] : ${JSON.stringify(result)}`);
		if (result.code == 226) {
			console.log(`Uploaded File (${localFile}) successfully. `);
			fs.unlink(localFile, (err) => {
				if (err) {
					throw err;
				}
				console.log("Delete File successfully.");
			});
		}
	}
	catch (err) {
		console.log(err)
	}
	client.close()
}