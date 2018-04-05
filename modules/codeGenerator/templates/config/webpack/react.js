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
		devtool: 'source-map',
		entry: [
			'@babel/polyfill',
			path.join(includePath, 'index.js')
		],
		output: {
			path: publicPath,
			filename: '[name].js',
			chunkFilename: '[id].chunk.js',
			publicPath: '/dist/'
		},
		resolve: {
			modules: ['node_modules', path.join(includePath, 'ramster-ui-components')]
		},
		module: {
			rules: [
				{
					test: /\.(jpg|png|svg|jpeg)$/,
					use: [{
						loader: 'file-loader',
						options: {
							name: '[path][name].[hash].[ext]',
						}
					}]
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
					include,
					exclude: [],
					use: ['style-loader', 'css-loader', 'sass-loader']
				},
				{
					test: /\.jsx?$/,
					include,
					exclude: [],
					use: ['babel-loader?cacheDirectory=false&plugins[]=@babel/plugin-transform-runtime&presets[]=@babel/preset-env&presets[]=@babel/preset-react']
				},
				{
					test: /\.json$/,
					include,
					exclude: [],
					use: ["json2-loader"]
				}
			]
		},
		localPlugins: [
			new webpack.HotModuleReplacementPlugin(),
			new BellOnBundlerErrorPlugin(),
			new ProgressBarPlugin({
				format: '  build [:bar] (:percent) - (:elapsed seconds)',
				clear: false,
				complete: '#',
				summary: 'true'
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
			})
		]
	}
}
