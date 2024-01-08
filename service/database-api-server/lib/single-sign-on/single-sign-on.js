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

var moduleFunction = ({ config: allConfigs, apiManager }) => ()=> {
	const localConfig = allConfigs['single-sign-on'];
	const systemConfig = allConfigs['system'];
	
	
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
				//value = tmpKey;
				console.log(
					`Warning: msal apparently does not need private keys; omitting from ${name}`
				);
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
	let districtConfigurations = {};
	const newConfiguration = {};
	
	const initDistrictMapping = async () => {
		if (districtConfigsAlreadyInit) {
			console.log('using cached SSO parameters');
			return;
		}

		const getDistrict = promisify(
			apiManager.getApi(
				'databaseApiServer.bookNumbers.users.session.boilerplate.payment.transfer.students.districts.getAllDistricts'
			)
		);

		const initDistrictConfigurations = async districts => {
			districtConfigsAlreadyInit = true;

			districts.forEach(async dbDistrict => {
				const district = dbDistrict.toObject();

				if (!district.ssoParameters.ssoModuleName) {
					return;
				}

				newConfiguration[district.districtId] = {
					...district.ssoParameters,
					districtId: district.districtId,
					providerSpecificModuleName: district.ssoParameters.ssoModuleName,
					authOptions: { entityId: district.ssoParameters.entityId }
				};
				const modulePath = `./lib/${district.ssoParameters.ssoModuleName}`;
				newConfiguration[
					district.districtId
				].providerSpecificModule = await require(modulePath)({
					systemConfig,
					district
				});
			});
		};

		const districts = await getDistrict();
		await initDistrictConfigurations(districts);
		//		districtConfigurations=newConfiguration;
	};

	// ==========================================================================
	// GET USER FROM IDENTITY PROVIDER

	const getSpecificIdentityProvider = async req => {
		const requestBody = req.body;

		const districtId = requestBody.qtGetSurePath('user.districtId');
		const districtSpecs = newConfiguration[districtId];
		
		// ACCESS ACTUAL PROVIDER ==================================================

		const { providerSpecificModule, getRedirectUrl } = districtSpecs;

		const ssoResult = await providerSpecificModule
			.getUserIdentity({
				requestBody,
				req
			})
			.catch(error => {
				throw new Error(
					`error:Q15920233606436064111 ${error.toString()}  [single-sign-on.js.moduleFunction]`
				);
			});

		return { ...ssoResult, providerSpecificModule };
	};
	
	const getProvider = async districtId => {
		await initDistrictMapping(); // initializes cache/closure variable districtConfigurations
		const districtSpecs = newConfiguration[districtId];
		const { providerSpecificModule: ssoProvider } = districtSpecs;
		return { ssoProvider, districtSpecs };
	};

	return { getSpecificIdentityProvider, getProvider };
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction;
//module.exports = new moduleFunction();
