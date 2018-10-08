'use strict'

const
	BellOnBundlerErrorPlugin = require('bell-on-bundler-error-plugin'),
	path = require('path'),
	ProgressBarPlugin = require('progress-bar-webpack-plugin'),
	UglifyJsPlugin = require('uglifyjs-webpack-plugin'),
	webpack = require('webpack')


module.exports = (config, name) => {
	let includePath = config.clientPath,
		publicPath = config.publicPath,
		nodeModulesPath = config.nodeModulesPath,
		include = [includePath]

	return {
		mode: config.mode,
		devtool: 'source-map',
		entry: [
			// '@babel/polyfill',
			path.join(includePath, 'polyfills.ts'),
			path.join(includePath, 'vendor.ts'),
			path.join(includePath, 'index.ts')
		],
		output: {
			path: publicPath,
			filename: '[name].js',
			chunkFilename: '[id].chunk.js',
			publicPath: '/dist/'
		},
		resolve: {
			extensions: ['.js', '.ts'],
			modules: ['node_modules']
		},
		module: {
			rules: [
				// {
				// 	test: /\.(jpg|png|svg|jpeg)$/,
				// 	use: [{
				// 		loader: 'file-loader',
				// 		options: {
				// 			name: '[path][name].[hash].[ext]',
				// 		}
				// 	}]
				// },
				{
					test: /\.pug$/,
					include,
					use: ['raw-loader', 'pug-html-loader']
				},
				{
					test: /\.css$/,
					include: [nodeModulesPath, includePath],
					exclude: [],
					use: ['style-loader', 'css-loader']
				},
				{
					test: /\.less$/,
					include: [nodeModulesPath, includePath],
					exclude: [],
					use: ['style-loader', 'css-loader', 'less-loader']
				},
				{
					test: /\.scss$/,
					include: [nodeModulesPath, includePath],
					exclude: [],
					use: ['raw-loader', 'sass-loader']
				},
				{
					test: /\.js$/,
					include,
					use: [{
						loader: 'babel-loader?cacheDirectory=false&plugins[]=transform-runtime&presets[]=es2015'
					}]
				},
				{
					test: /\.ts$/,
					include: [includePath, libPath],
					use: [{
							loader: 'ng-router-loader',
							options: {loader: 'async-import', genDir: 'compiled', aot: true}
						}, {
							loader: 'ts-loader'
						}, {
							loader: 'angular2-template-loader'
						}
					],
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
			new webpack.ContextReplacementPlugin(/\@angular(\\|\/)core(\\|\/)esm5/, path.join(__dirname, '../clients/site')),
			new webpack.ProvidePlugin({
				'$': 'jquery',
				'jQuery': 'jquery',
				'window.jQuery': 'jquery'
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
			new UglifyJsPlugin({
				sourceMap: false,
				uglifyOptions: {
					mangle: true,
					compress: true
				}
			}),
			new webpack.DefinePlugin({
				'process.env': {
					'NODE_ENV': JSON.stringify('production')
				}
			}),
			new webpack.ContextReplacementPlugin(/\@angular(\\|\/)core(\\|\/)esm5/, path.join(__dirname, '../clients/site')),
			new webpack.ProvidePlugin({
				'$': 'jquery',
				'jQuery': 'jquery',
				'window.jQuery': 'jquery'
			})
		]
	}
}
