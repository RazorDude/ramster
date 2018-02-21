'use strict'

const
	BellOnBundlerErrorPlugin = require('bell-on-bundler-error-plugin'),
	path = require('path'),
	ProgressBarPlugin = require('progress-bar-webpack-plugin'),
	webpack = require('webpack')


module.exports = (config, name) => {
	let includePath = config.clientPath,
		publicPath = config.publicPath,
		include = [includePath]

	return {
		devtool: 'source-map',
		entry: [
			'babel-polyfill',
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
			loaders: [
				{
					test: /\.(jpg|png|svg|jpeg)$/,
					loader: 'file-loader',
					options: {
						name: '[path][name].[hash].[ext]',
					},
				},
				{
					test: /\.css$/,
					include: [path.join(__dirname, '../node_modules'), includePath],
					exclude: [],
					loaders: ['style-loader', 'css-loader']
				},
				{
					test: /\.less$/,
					include: [path.join(__dirname, '../node_modules'), includePath],
					exclude: [],
					loaders: ['style-loader', 'css-loader', 'less-loader']
				},
				{
					test: /\.scss$/,
					include,
					exclude: [],
					loaders: ['style-loader', 'css-loader', 'sass-loader']
				},
				{
					test: /\.jsx?$/,
					include,
					exclude: [],
					loader: `babel-loader?cacheDirectory=false&plugins[]=transform-runtime&presets[]=es2015&presets[]=react&presets[]=stage-0${name === 'production' ? '' : '&presets[]=react-hmre'}`
				},
				{
					test: /\.json$/,
					include,
					exclude: [],
					loader: "json2-loader"
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
			new webpack.NoErrorsPlugin(),
			new BellOnBundlerErrorPlugin(),
			new ProgressBarPlugin({
				format: '  build [:bar] (:percent) - (:elapsed seconds)',
				clear: false,
				complete: '#',
				summary: 'true'
			}),
			new webpack.optimize.UglifyJsPlugin({
				sourceMap: false,
				mangle: true,
				compress: true
			}),
			new webpack.DefinePlugin({
				'process.env': {
					'NODE_ENV': JSON.stringify('production')
				}
			})
		]
	}
}
