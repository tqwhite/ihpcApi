'use strict';

const fs = require('fs');
const qt = require('qtools-functional-library');

const commandLineParser = require('qtools-parse-command-line');
const configFileProcessor = require('qtools-config-file-processor');

const findConfigFile = require('./find-config-file');
const helpText = require('./lib/help-text');
const figureOutConfigPathGen = require('./lib/figure-out-config-path'); //this file is almost always customized

//START OF moduleFunction() ============================================================

const moduleFunction = function({ configPath }) {
	const { xLog } = process.global;
	const validControls = [
		'-help',
		'--help',
		'-silent',
		'-quiet',
		'-verbose',
		'-noColor',
// 		'-showConfig',
// 		'--overrideConfigPath',
		'--refId',
		'--bookNumber',
		'-tsv',
		'-json'
	];
	
	
	const commandLineParameters = commandLineParser.getParameters();
	const figureOutConfigPath = figureOutConfigPathGen({});
	

	//==============================================================================
	// Check for valid switches
	
	const errors = process.argv.filter(item => item.match(/^-/)).filter(item => {
		return !validControls.filter(validItem => item.match(validItem)).length;
	}); //using argv allows checking commandLineParameters switches and values in one line, worth stepping outside the framework

	if (errors.length) {
		xLog.error(
			errors.map(item => `Illegal switch, ${item} cannot be used`).join('\n')
		);
		process.exit();
	}

	//==============================================================================
	// Show help
	
		if (commandLineParameters.switches.help || commandLineParameters.values.help) {
			xLog.status(
				helpText.mainHelp({configPath})
			);
			process.exit();
			return;
		}

	//==============================================================================
	// Check for valid switches
	
	const overrideConfigPath = commandLineParameters.qtGetSurePath(
		'values.overrideConfigPath[0]'
	);

	configPath = overrideConfigPath ? overrideConfigPath : configPath;

	if (!fs.existsSync(configPath)) {
		xLog.error(`Config file missing. ${configPath} does not exist.`);
		process.exit();
		return;
	}
	// xLog.status(`Using config file: ${configPath}\n`);
	const rawConfig = configFileProcessor.getConfig(configPath);

	//==============================================================================
	// Show config
	
	if (commandLineParameters.switches.showConfig){
		xLog.status('WARNING: do not enable -showConfigs unless you want secrets to become visible');
		process.exit();
		xLog.status(rawConfig, {depth:6});
		process.exit();
	}
	
	//==============================================================================
	// Prepare return values
	
	Object.freeze(rawConfig);
	Object.freeze(commandLineParameters);

	const getConfig = segmentName => rawConfig[segmentName];

	return { getConfig, commandLineParameters, rawConfig };
};

//END OF moduleFunction() ============================================================

module.exports = args => new moduleFunction(args);

