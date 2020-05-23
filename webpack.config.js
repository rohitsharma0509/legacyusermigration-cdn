/* eslint-env node */

const path = require('path');
const fs = require('fs');

module.exports = {
  entry: {
    // depending on what your project's entry point javascript file is,
    // you will need to modify the following line.
    'team-migration-plugin': './js/team-migration-plugin.js',
    'main': './js/main.js'
  },

  module: {
    rules: [
      {
        test: /\.js$/,

        use: [
          {loader:"babel-loader"},
          {loader:"eslint-loader"}
        ],
        exclude: [/node_modules/]
      },
      {
        test: /\.css$/i,
        use: [
          {
            loader: "style-loader"
          },
          {
            loader: "css-loader",
            options: {url: false}
          }
        ]
      },
      {
        test: /\.less$/,
        use: [
          {loader: "style-loader"},
          {loader: "css-loader"},
          {loader: "less-loader"}
        ],
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'images/[name]-[hash].[ext]'
            }
          }
        ]
      },
      {
        test: /\.(woff(2)?|eot|ttf|svg)(\?[a-z0-9=\.]+)?$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[path][name].[ext]"
            }
          }
        ]
      },
      {
        test: /\.(md)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'docs/[name]-[hash].[ext]'
            }
          }
        ]
      }]
  },

  output: {
    filename: '__VERSION__/[name].js',
    chunkFilename: '__VERSION__/nls/translations_[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  devtool  : 'inline-source-map',
  devServer: {
    contentBase: path.join(__dirname, 'dist'),

    // overlay: true captures only errors
    overlay: {
      errors: true,
      warnings: true
    },

    port: 9000,
    publicPath: '/',
    host: 'secure.local.echocdn.com',

    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    },

    // comment out the following 3 lines if you don't want HTTPS support
    https: true,
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
  }
};
