#!/usr/bin/env node
'use strict';

const moduleName = __filename.replace(__dirname + '/', '').replace(/.js$/, ''); //this just seems to come in handy a lot
//const projectRoot=fs.realpathSync(path.join(__dirname, '..', '..')); // adjust the number of '..' to fit reality

const qt = require('qtools-functional-library'); //qt.help({printOutput:true, queryString:'.*', sendJson:false});

// const asynchronousPipePlus = new require('qtools-asynchronous-pipe-plus')();
// const pipeRunner = asynchronousPipePlus.pipeRunner;
// const taskListPlus = asynchronousPipePlus.taskListPlus;
const qtoolsGen = require('qtools');
const qtools = new qtoolsGen(module);

const https = require('https');
const fs = require('fs');
const util = require('util');

const samlify = require('samlify');

const xml2js = require('xml-js');

// START OF moduleFunction() ============================================================

const moduleFunction = function(args = {}) {
	// ====================================================================================
	// UTILITY FUNCTIONS
	
	// ====================================================================================
	// FINALFUNCTION FUNCTION

	const FINALFUNCTION = async ({ ssoToken, districtSpecs, requestBody, req }) => {
const xml2js = require('xml-js');
		const serviceProvider = samlify.ServiceProvider(districtSpecs.authOptions);

const idp = samlify.IdentityProvider({
  metadata: fs.readFileSync('/Users/tqwhite/Documents/webdev/ihpCreator/applications/api/system/code/service/database-api-server/lib/single-sign-on/lib/IHPC SAML APP.xml')
});
		let userDetails = {};
		try {

			const SAMLResponse = ssoToken;
			const response = Buffer.from(SAMLResponse, 'base64').toString('utf-8');
			const parsedResponse = xml2js.xml2js(response, { compact: true });

			// Validate the SAML response
console.log(`\n=-=============   parseLoginResponse  ========================= [azure-msal-saml.js.moduleFunction]\n`);




			const { extract } = await serviceProvider.parseLoginResponse(
				idp,
				'post',
				req
			);
console.log(`\n=-=============   parseLoginResponse 2 ========================= [azure-msal-saml.js.moduleFunction]\n`);


			userDetails = extract.attributes;
		} catch (error) {
			console.error('Error processing SAML Response:', error);
		}

		const { userName, password } = userDetails;

		return { userName, password };
	};
	// util.promisify()

	// ====================================================================================
	// MAIN FUNCTION

	const getUserIdentity = async ({ requestBody, districtSpecs, req }) => {
		const ssoToken = requestBody.qtGetSurePath('user.ssoToken');

		const ssoAccount = await FINALFUNCTION({ ssoToken, districtSpecs, requestBody, req });
		return ssoAccount;
	};

	return { getUserIdentity };
};

// END OF moduleFunction() ============================================================

module.exports = moduleFunction;
//module.exports = new moduleFunction();
//moduleFunction().workingFunction().qtDump();

