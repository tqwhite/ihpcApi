'use strict';
const qtoolsGen = require('qtools');
const qtools = new qtoolsGen(module);
const path = require('path');

// https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples/on-behalf-of
const samlify = require('samlify');
const tmpKey = `-----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----
`;
//START OF moduleFunction() ============================================================

var moduleFunction = function({ config }) {
	
	const { placeholder } = config['single-sign-on'];
	//LOCAL VARIABLES ====================================

	const getUserFromIdentityProvider = async req => {
		const requestBody=req.body
		if ('DO SSO omitStuffThatIsBroken' == 'omitStuffThatIsBroken') {
			return { userName: 'tqwhite' };
		}

		const districtId = requestBody.qtGetSurePath('user.districtId');

		const tempDistrictMapping = {
			['dmschoolsSAML.org']: {
				ssoModuleName: 'azure-msal-saml',
				authOptions: {
					entityID: 'Q41220235325753257313',
					privateKey: tmpKey,
					decryptionPvk: tmpKey,
					authnRequestsSigned: false,
					wantAssertionsSigned: true,
					wantMessageSigned: true,
					isAssertionEncrypted: true,
					assertionConsumerService: [
						{
							Binding: samlify.Constants.namespace.post,
							Location: 'https://ihpc.qbook.work/SSO/saml/'
						}
					],
					signatureConfig: {
						privateKey: tmpKey
						// Specify other signature-related configurations as needed
					}
				}
			},
			['dmschoolsSAMLUNUSED.org']: {
				ssoModuleName: 'azure-msal-saml',
				authOptions: {
					clientId: '1c3b4392-c123-4f88-b1ba-b32255b18141',
					authority:
						'https://login.microsoftonline.com/bba67e09-06e0-4d07-9123-acdb7a262a91',
					clientCertificate: {
						thumbprint: '2F4848A44EEEC7294E9B75743CE62A40826D1193', // can be obtained when uploading certificate to Azure AD
						privateKey: tmpKey
					}
				}
			},
			['dmschoolsOPENID.org']: {
				ssoModuleName: 'azure-msal-openid',
				tenantId: 'bba67e09-06e0-4d07-9123-acdb7a262a91',
				authOptions: {
					clientId: '303941c0-c24e-44f9-9b3c-d9b2366f22e3',
					authority:
						'https://login.microsoftonline.com/bba67e09-06e0-4d07-9123-acdb7a262a91',
					clientSecret: 'gK68Q~RB3.Dukr75ZJIZzcePfdPDCz6d5U4LCcMX'
				},
				serverPort: 8000,
				webApiScope: ['User.Read'],
				discoveryKeysEndpoint:
					'https://login.microsoftonline.com/bba67e09-06e0-4d07-9123-acdb7a262a91/discovery/v2.0/keys'
			}
		}; //this will come from the database

		const districtSpecs = tempDistrictMapping[districtId];

		const { ssoModuleName } = districtSpecs;

		// ACCESS ACTUAL PROVIDER ==================================================

		const providerSpecificFunctionsPath = `./lib/${ssoModuleName}`; // .../database-api-server/lib/single-sign-on/lib/azure-msal-functions.js
		const providerSpecificFunctions = require(providerSpecificFunctionsPath)();

		let ssoResult = await providerSpecificFunctions
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

		console.log(`ssoResult=${ssoResult.length}`);

		return { ...ssoResult, ssoModuleName, districtSpecs };
	};
	
	return { getUserFromIdentityProvider };
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction;
//module.exports = new moduleFunction();
