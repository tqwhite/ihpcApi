#!/usr/bin/env node
'use strict';

const qt = require('qtools-functional-library');
const configFileProcessor = require('qtools-config-file-processor');

const os=require('os');

//START OF moduleFunction() ============================================================

const moduleFunction = function() {
	const { xLog } = process.global;

	const getConfig = (
		{ filePath, options = {} },
		callback
	) => {
		
		const configOptions = {
				userSubstitutions: {
					remoteBasePath: '<!prodRemoteBasePath!>',
					userHomeDir:os.homedir()
				}
			};

		if (filePath.match(/\.ini$/)) {
			const rawConfig = configFileProcessor.getConfig(
				filePath,
				'.',
				configOptions
			);

			if (
				options.useProdPath &&
				!rawConfig.qtGetSurePath('_substitutions.prodRemoteBasePath')
			) {
				callback(
					`-prod was set but _substitutions.prodRemoteBasePath was missing from config ${filePath}`
				);
				return;

			}



			callback('', rawConfig);
		}
	};

	return { getConfig };
};

//END OF moduleFunction() ============================================================

module.exports = new moduleFunction();
