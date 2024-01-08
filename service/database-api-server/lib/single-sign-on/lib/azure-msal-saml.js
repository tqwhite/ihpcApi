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
const xmljs = require('xml-js');

// START OF moduleFunction() ============================================================

const moduleFunction = async function({ systemConfig = {}, district } = {}) {
	// ====================================================================================
	// UTILITY FUNCTIONS
	
	console.log(
		`WARNING: systemConfig is defaulted and not verified [azure-msal=saml]`
	);
	const axios = require('axios');
	
	const { baseUrl } = systemConfig;

	let ihpcSamlAppXml;
	const initXml = async districtSpecs => {
		if (ihpcSamlAppXml) {
			console.log('using cached SAML XML');
			return;
		}

		const { xmlUrl } = districtSpecs;
		try {
			const url = xmlUrl;

			const response = await axios.get(url);

			// const samlSpecs = xmljs.xml2js(response.data, { compact: true });
			// console.dir({['samlSpecs']:samlSpecs}, { showHidden: false, depth: 8, colors: true });

			ihpcSamlAppXml = response.data; //save to cache/closure variable
		} catch (error) {
			console.log(`error:Q121220235658456584922 ${error.toString()}  [${moduleName}]`)
			throw new Error(
				`error:Q121220235658456584922 ${error.toString()}  [${moduleName}]`
			);
		}
	};

	// ====================================================================================
	// UTILITY FUNCTIONS
	const alphaNumericRandom = (digits = 20) => {
		const getChar = () => {
			const root = Math.floor(Math.random() * 62);
			const allChars =
				'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
			return allChars.substring(root, root + 1);
		};
		let outString = '';
		digits.qtIterate(unused => (outString = getChar() + outString));
		return outString;
	};
	
	// ====================================================================================
	// FINALFUNCTION FUNCTION

	const FINALFUNCTION = async ({ ssoToken, districtSpecs, req }) => {
		console.log(
			`\n=-=============   FINALFUNCTION SAML ========================= [azure-msal-saml.js.moduleFunction]\n`
		);

		await initXml(districtSpecs); // initializes cache/closure variable ihpcSamlAppXml

		samlify.setSchemaValidator({
			validate: responseXml => {
				// I don't see anything useful here. I'll leave xml-js in so that I can easily inspect later.
				// const response = xmljs.xml2js(responseXml, { compact: true });

				/* implment your own or always returns a resolved promise to skip */
				return Promise.resolve('skipped');
			}
		});

		const assertionConsumerService = [
			{
				Binding: samlify.Constants.namespace.post,
				Location: `${baseUrl}x/SSO/saml/`
			}
		]; // I think none of this is required.

		const serviceProvider = samlify.ServiceProvider({
			...districtSpecs.authOptions,
			assertionConsumerService
		});

		const idp = samlify.IdentityProvider({
			metadata: ihpcSamlAppXml
		});

		let userDetails = {};
		try {
			const SAMLResponse = ssoToken;

			const { extract } = await serviceProvider.parseLoginResponse(
				idp,
				'post',
				{
					...req,
					body: { SAMLResponse }
				}
			);
			userDetails = extract.attributes;

			// prettier-ignore
// 						{
// 							console.log(
// 								`\n=-=============   userDetails  ========================= [azure-msal-saml.js.moduleFunction]\n`
// 							);
// 							console.dir( { ['userDetails']: userDetails }, { showHidden: false, depth: 4, colors: true } );
// 							console.log(`Identity validation based on: '${userPropertyName}'`);
// 							console.log(
// 								`\n=-=============   userDetails  ========================= [azure-msal-saml.js.moduleFunction]\n`
// 							);
// 						}
		} catch (error) {
			console.error('Error processing SAML Response:', error);
		}

		let userPropertyName =
			'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';

		let userName = userDetails[userPropertyName];

		if (userName.match(/#/) && userName.match(/tq/i)) {
			console.log(`WARNING: found bad SSO username and TQ. Using emailaddress`);
			userName =
				userDetails[
					'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
				];
		}

		const password = 'unused';

		return { userName, password };
	};
	// util.promisify()

	// ====================================================================================
	// MAIN FUNCTION

	const getUserIdentity = async ({ req }) => {
		const districtSpecs = {
			xmlUrl: district.ssoParameters.xmlUrl,
			authOptions: { entityId: district.ssoParameters.entityId }
		};

		const ssoToken = req.qtGetSurePath('body.user.ssoToken');

		const ssoAccount = await FINALFUNCTION({
			ssoToken,
			districtSpecs,
			req
		});
		return ssoAccount;
	};
	
	const getRedirectUrl = ({ ssoParameters }) => {
		const redirectUrl = ssoParameters.redirectUrl
			? ssoParameters.redirectUrl.replace(/^\/*/, '')
			: '';
		const logoutUrl = ssoParameters.logoutUrl
			? ssoParameters.logoutUrl.replace(/^\/*/, '')
			: '';
		const entityId = ssoParameters.entityId ? ssoParameters.entityId : '';
		const issueInstant = new Date().toISOString();

		const randomNum = alphaNumericRandom();

		const loginXml = `<saml2p:AuthnRequest xmlns:saml2p="urn:oasis:names:tc:SAML:2.0:protocol" Destination="${redirectUrl}" ID="${entityId}" IsPassive="false" IssueInstant="${issueInstant}" ProviderName="IHPCREATOR.COM" Version="2.0" > <saml2:Issuer xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion">${entityId}</saml2:Issuer> </saml2p:AuthnRequest>`;
		const loginToken = encodeURIComponent(
			require('zlib')
				.deflateRawSync(loginXml)
				.toString('base64')
		);

		const logoutXml = `<samlp:AuthnRequest
xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
ID="Q${randomNum}"
Version="2.0"
IssueInstant="${issueInstant}">
<saml:Issuer>${entityId}</saml:Issuer>
</samlp:AuthnRequest>`;
		const logoutToken = encodeURIComponent(
			require('zlib')
				.deflateRawSync(logoutXml)
				.toString('base64')
		);

		return {
			redirectUrl: `${redirectUrl}?SAMLRequest=${loginToken}`,
			logoutUrl: `${logoutUrl}?SAMLRequest=${logoutToken}`
		};
	};

	return { getUserIdentity, getRedirectUrl };
};

// END OF moduleFunction() ============================================================

module.exports = moduleFunction;
//module.exports = new moduleFunction();
//moduleFunction().workingFunction().qtDump();

