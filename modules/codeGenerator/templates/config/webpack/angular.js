'use strict'

const
	AngularCompilerPlugin = require( "@ngtools/webpack" ).AngularCompilerPlugin,
	BellOnBundlerErrorPlugin = require('bell-on-bundler-error-plugin'),
	BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin,
	path = require('path'),
	ProgressBarPlugin = require('progress-bar-webpack-plugin'),
	TerserPlugin = require('terser-webpack-plugin'),
	webpack = require('webpack')


module.exports = (config) => {
	let includePath = config.clientPath,
		publicPath = config.publicPath,
		nodeModulesPath = config.nodeModulesPath,
		include = [includePath]

	return {
		mode: config.mode,
		devtool: 'source-map',
		entry: [
			path.join(includePath, 'polyfills.ts'),
			path.join(includePath, 'vendor.common.ts'),
			path.join(includePath, 'vendor.browser.ts'),
			path.join(includePath, 'index.ts')
		],
		output: {
			path: publicPath,
			filename: '[name].js',
			chunkFilename: '[id].chunk.js',
			publicPath: '/dist/'
		},
		resolve: {
			extensions: ['.ts', '.js'],
			modules: ['node_modules']
		},
		module: {
			rules: [
				{
					test: /\.pug$/,
					include,
					use: ['raw-loader', 'pug-html-loader']
				},
				{
					test: /\.css$/,
					include: [nodeModulesPath, includePath],
					exclude: [],
					use: ['to-string-loader', 'css-loader']
				},
				{
					test: /\.less$/,
					exclude: [],
					use: ['to-string-loader', 'css-loader', 'less-loader']
				},
				{
					test: /\.scss$/,
					include: [nodeModulesPath, includePath],
					exclude: [],
					use: ['raw-loader', 'sass-loader']
				},
				{
					test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
					include,
					use: [{
						loader: '@ngtools/webpack'
					}],
					exclude: [/\.(spec|e2e)\.ts$/]
				},
				{
					test: /\.json$/,
					include,
					exclude: [],
					use: ["json2-loader"]
				}
			]
		},
		stats: 'verbose',
		localPlugins: [
			new webpack.HotModuleReplacementPlugin(),
			new BellOnBundlerErrorPlugin(),
			new ProgressBarPlugin({
				format: '  build [:bar] (:percent) - (:elapsed seconds)',
				clear: false,
				complete: '#',
				summary: 'true'
			}),
			new webpack.NamedModulesPlugin(),
			new AngularCompilerPlugin({
				tsConfigPath: path.join(__dirname, '../../tsconfig.browser.json'),
				entryModule: path.join(includePath, 'app.ts#AppModule'),
				sourceMap: true
			})
		],
		productionPlugins: [
			new webpack.NoEmitOnErrorsPlugin(),
			new BellOnBundlerErrorPlugin(),
			new ProgressBarPlugin({
				format: '  build [:bar] (:percent) - (:elapsed seconds)',
				clear: false,
				complete: '#',
				summary: 'true'
			}),
			new webpack.HashedModuleIdsPlugin(),
			new TerserPlugin({
				terserOptions: {
					ecma: 6,
					warnings: true,
					compress: {
						ecma: 6
					},
					mangle: true
				}
			}),
			new webpack.DefinePlugin({
				'process.env': {
					'NODE_ENV': JSON.stringify('production')
				}
			}),
			new AngularCompilerPlugin({
				tsConfigPath: path.join(__dirname, '../../tsconfig.browser.json'),
				entryModule: path.join(includePath, 'app.ts#AppModule'),
				sourceMap: false
			})
		],
		productionDebugPlugins: [
			new BundleAnalyzerPlugin(),
			new webpack.NoEmitOnErrorsPlugin(),
			new BellOnBundlerErrorPlugin(),
			new ProgressBarPlugin({
				format: '  build [:bar] (:percent) - (:elapsed seconds)',
				clear: false,
				complete: '#',
				summary: 'true'
			}),
			new webpack.DefinePlugin({
				'process.env': {
					'NODE_ENV': JSON.stringify('production')
				}
			}),
			new AngularCompilerPlugin({
				tsConfigPath: path.join(__dirname, '../../tsconfig.browser.json'),
				entryModule: path.join(includePath, 'app.ts#AppModule'),
				sourceMap: true
			})
		]
	}
}
