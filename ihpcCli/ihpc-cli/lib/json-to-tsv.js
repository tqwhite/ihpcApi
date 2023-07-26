#!/usr/bin/env node
'use strict';


//END OF moduleFunction() ============================================================

module.exports =  jsonData => {
		const allKeys = Array.from(
			jsonData.reduce((keys, obj) => {
				Object.keys(obj).forEach(key => keys.add(key));
				return keys;
			}, new Set())
		); // Get the superset of all keys

		const headers = allKeys.join('\t'); // Get headers (property names) as a tab-separated string
		const rows = jsonData.map(obj =>
			allKeys.map(key => obj[key] ?? '').join('\t')
		);
		const tsvData = `${headers}\n${rows.join('\n')}`; // Combine headers and rows into a single TSV string

		return tsvData;
	};
	