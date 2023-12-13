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

const msal = require('@azure/msal-node');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const https = require('https');
const fs = require('fs');
const util = require('util');

// START OF moduleFunction() ============================================================

// ====================================================================================
// CRAP THAT CAME WITH THE BOILERPLATE I STOLE AND I DON'T KNOW HOW TO USE

const webApiCachePlugin = (function(cacheLocation) {
	const beforeCacheAccess = cacheContext => {
		return new Promise((resolve, reject) => {
			if (fs.existsSync(cacheLocation)) {
				fs.readFile(cacheLocation, 'utf-8', (err, data) => {
					if (err) {
						reject(err);
					} else {
						cacheContext.tokenCache.deserialize(data);
						resolve();
					}
				});
			} else {
				fs.writeFile(
					cacheLocation,
					cacheContext.tokenCache.serialize(),
					err => {
						if (err) {
							reject(err);
						}
					}
				);
			}
		});
	};

	const afterCacheAccess = cacheContext => {
		return new Promise((resolve, reject) => {
			if (cacheContext.cacheHasChanged) {
				fs.writeFile(
					cacheLocation,
					cacheContext.tokenCache.serialize(),
					err => {
						if (err) {
							reject(err);
						}
						resolve();
					}
				);
			} else {
				resolve();
			}
		});
	};

	return {
		beforeCacheAccess,
		afterCacheAccess
	};
})('/tmp/msalCache');

const moduleFunction = async function({systemConfig} = {}) {
	// ====================================================================================
	// UTILITY FUNCTIONS

	const validateJwt = (req, res, next) => {
		const authHeader = req.headers.authorization;
		if (authHeader) {
			const token = authHeader.split(' ')[1];

			const validationOptions = {
				audience: clientId, // v2.0 token
				issuer: `${authority}/v2.0` // v2.0 token
			};

			jwt.verify(token, getSigningKeys, validationOptions, (err, payload) => {
				if (err) {
					console.log(err);
					return res.sendStatus(403);
				}

				next();
			});
		} else {
			res.sendStatus(401);
		}
	};
	const getSigningKeys = (header, callback) => {
		var client = jwksClient({
			jwksUri: discoveryKeysEndpoint
		});

		client.getSigningKey(header.kid, function(err, key) {
			var signingKey = key.publicKey || key.rsaPublicKey;
			callback(null, signingKey);
		});
	};

	const callGraph = (accessToken, callback) => {
		const options = {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		};

		const req = https.request(
			new URL('https://graph.microsoft.com/v1.0/me'),
			options,
			res => {
				res.setEncoding('utf8');
				res.on('data', chunk => {
					callback(chunk);
				});
			}
		);
		req.on('error', err => {
			console.log(
				`err.toString()=${err.toString()}  [azure-msal-functions.js.moduleFunction:165]`
			);
		});
		req.end();
	};

	
	// ====================================================================================
	// FINALFUNCTION FUNCTION
	
	
	const FINALFUNCTION = async ({ ssoToken, districtSpecs }) => {
		const cca = new msal.ConfidentialClientApplication({
			auth: districtSpecs.authOptions,
			cache: { cachePlugin: webApiCachePlugin }
		});

		const oboRequest = {
			oboAssertion: ssoToken,
			scopes: ['user.read']
		};

		const callGraphResponse = await cca
			.acquireTokenOnBehalfOf(oboRequest)
			.catch(error => {
				throw new Error(
					`error:Q15920233606436064111 ${error.toString()}  [${moduleName}.moduleFunction]`
				);
			});

		const { username: userName, name } = callGraphResponse.account;

		const password = qtools.passwordHash(userName, 'Q18920235458654586922'); //password is not used; created for data structure completeness

		return { userName, password };
	};
	
	// ====================================================================================
	// MAIN FUNCTION
	
	const getUserIdentity = async ({ requestBody, districtSpecs }) => {
		const ssoToken = requestBody.qtGetSurePath('user.ssoToken');

		const ssoAccount = await FINALFUNCTION({ ssoToken, districtSpecs });
		return ssoAccount;
	};

	return { getUserIdentity };
};

// END OF moduleFunction() ============================================================

module.exports = moduleFunction;
//module.exports = new moduleFunction();
//moduleFunction().workingFunction().qtDump();

