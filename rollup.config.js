/* globals process */

var buble = require('rollup-plugin-buble');
var uglify = require('rollup-plugin-uglify');
// import { uglify } from 'rollup-plugin-uglify';

var nodeResolve = require('rollup-plugin-node-resolve');

var environment = process.env.ENV || 'development';
var isDevelopmentEnv = (environment === 'development');

module.exports = [
	{
		input: './public/datafeeds/adapter/lib/datafeed.js',
		name: 'Datafeeds',
		sourceMap: false,
		output: {
			format: 'umd',
			file: './public/datafeeds/adapter/dist/bundle.js',
		},
		plugins: [
			nodeResolve({ jsnext: true, main: true }),
			buble(),
			!isDevelopmentEnv && uglify({ output: { inline_script: true } }),
		],
	},
	{
		input: './public/datafeeds/adapter/src/polyfills.es6',
		sourceMap: false,
		context: 'window',
		output: {
			format: 'iife',
			file: './public/datafeeds/adapter/dist/polyfills.js',
		},
		plugins: [
			nodeResolve({ jsnext: true, main: true }),
			buble(),
			uglify({ output: { inline_script: true } }),
		],
	},
];
