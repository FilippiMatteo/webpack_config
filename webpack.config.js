const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index_casting.js',
  output: {
    filename: 'casting.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use:[
          'style-loader',
          'css-loader'
        ]
      }
    ]
  }
};