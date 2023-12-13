'use strict';
const qtoolsGen = require('qtools');
const qtools = new qtoolsGen(module);

const path = require('path');

// https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples/on-behalf-of
let tmpKey;
const crypto = require('crypto');
const { promisify } = require('util');

const generateKeyPair = promisify(crypto.generateKeyPair);

//START OF moduleFunction() ============================================================

var moduleFunction = function({ config: allConfigs }) {

	const localConfig = allConfigs['single-sign-on'];

	let keyAlreadyExistsFlag = false;
	async function generateKeys(tmpKey) {
		if (keyAlreadyExistsFlag) {
			return tmpKey;
		}
		keyAlreadyExistsFlag = true;

		try {
			const { publicKey, privateKey } = await generateKeyPair('rsa', {
				modulusLength: 4096, // 4k
				publicKeyEncoding: {
					type: 'spki',
					format: 'pem'
				},
				privateKeyEncoding: {
					type: 'pkcs8',
					format: 'pem'
				}
			});

			return { publicKey, privateKey };
		} catch (err) {
			console.error(err);
		}
	}

	// ==========================================================================
	// GATHER DISTRICT CONFIGS

	const districtConfigurations = {};

	const isNumeric = str => {
		return !isNaN(parseFloat(str)) && isFinite(str);
	};

	const getDistrictConfig = (config, configName) => {
		const currentConfig = config[configName];
		return currentConfig;
	};

	const conditionConfigElements = (inObject, tmpKey) => {

		const outObj = {};
		Object.keys(inObject).forEach(name => {
			let value = inObject[name];

			if (typeof value == 'object') {
				value = conditionConfigElements(value, tmpKey);
			}

			if (typeof value == 'object' && isNumeric(Object.keys(value)[0])) {
				value = qtools.convertNumericObjectToArray(value);
			}

			if (value.toString().match(/tmpKey/)) {
				value = tmpKey;
			}

			switch (value) {
				case 'true':
					value = true;
					break;
				case 'false':
					value = false;
					break;
			}

			outObj[name] = value;
		});

		return outObj;
	};


	// ==========================================================================
	// INIT ASYNC PARTS OF DISTRICT MAPPING
	
	let districtConfigsAlreadyInit = false;
	const initDistrictMapping = async () => {
		if (districtConfigsAlreadyInit) {
			console.log('using cached SSO parameters');
			return;
		}

		districtConfigsAlreadyInit = true;

		// let keys;
		//keys = await generateKeys(keys);
		const tmpKey = undefined; //keys.privateKey;
		console.log(`Warning: msal apparently does not need private keys; omitting them even if in config`)

		Object.keys(localConfig.configRedirectNameGroupList)
			.map(inx => localConfig.configRedirectNameGroupList[inx])
			.map(configItem => ({
				...getDistrictConfig(allConfigs, configItem.configName),
				configName: configItem.configName,
				districtId: configItem.districtId
			}))
			.map(configItem => conditionConfigElements(configItem, tmpKey))
			.forEach(item => (districtConfigurations[item.districtId] = item));

		// prettier-ignore
		Object.keys(districtConfigurations).forEach(
			async name=>{
				const modulePath=`./lib/${districtConfigurations[name].providerSpecificModuleName}`;
				const moduleInstance=districtConfigurations[name].providerSpecificModule=await require(modulePath)();
				districtConfigurations[name].providerSpecificModule=moduleInstance;
			})
	};

	// ==========================================================================
	// GET USER FROM IDENTITY PROVIDER

	const getUserFromIdentityProvider = async req => {
		console.log(
			`\n=-=============   getUserFromIdentityProvider  ========================= [single-sign-on.js.moduleFunction]\n`
		);

		await initDistrictMapping(); // initializes cache/closure variable districtConfigurations

		const requestBody = req.body;

		const districtId = requestBody.qtGetSurePath('user.districtId');
		const districtSpecs = districtConfigurations[districtId];

		// ACCESS ACTUAL PROVIDER ==================================================

		const { providerSpecificModule } = districtSpecs;
		const ssoResult = await providerSpecificModule
			.getUserIdentity({
				requestBody,
				districtSpecs,
				req
			})
			.catch(error => {
				throw new Error(
					`error:Q15920233606436064111 ${error.toString()}  [single-sign-on.js.moduleFunction]`
				);
			});

		return { ...ssoResult, providerSpecificModule, districtSpecs };
	};

	return { getUserFromIdentityProvider };
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction;
//module.exports = new moduleFunction();
