const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');

module.exports = merge(common, {
  mode: 'production',
  // -------------rinkeby--------------
  // plugins: [
  //   new webpack.DefinePlugin({
  //     'process.env.ETH_NETWORK': JSON.stringify('rinkeby'),
  //   }),
  //   new webpack.DefinePlugin({
  //     'process.env.UNI_GRAPH': JSON.stringify('https://api.thegraph.com/subgraphs/name/alejoamiras/uniswap-v3-rinkeby'),
  //   }),
  //   new webpack.DefinePlugin({
  //     'process.env.DCA_GRAPH': JSON.stringify('https://api.thegraph.com/subgraphs/name/alejoamiras/dca-rinkeby-stable'),
  //   }),
  //   new webpack.DefinePlugin({
  //     'process.env.ETHERSCAN_API': JSON.stringify('4UTUC6B8A4X6Z3S1PVVUUXFX6IVTFNQEUF'),
  //   }),
  //   new webpack.DefinePlugin({
  //     'process.env.FACTORY_ADDRESS': JSON.stringify('0xCbb75279D84eB2ae32a750cb88bcaeb8e5de6002'),
  //   }),
  // ],
  // // -------------meanfinance--------------
  // plugins: [
  //   new webpack.DefinePlugin({
  //     'process.env.ETH_NETWORK': JSON.stringify('meanfinance'),
  //   }),
  //   new webpack.DefinePlugin({
  //     'process.env.UNI_GRAPH': JSON.stringify('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3'),
  //   }),
  //   new webpack.DefinePlugin({
  //     'process.env.DCA_GRAPH': JSON.stringify('http://3.235.77.84:8000/subgraphs/name/alejoamiras/dca-subgraph'),
  //   }),
  //   new webpack.DefinePlugin({
  //     'process.env.ETHERSCAN_API': JSON.stringify('4UTUC6B8A4X6Z3S1PVVUUXFX6IVTFNQEUF'),
  //   }),
  //   new webpack.DefinePlugin({
  //     'process.env.FACTORY_ADDRESS': JSON.stringify('0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00'),
  //   }),
  // ],
  // -------------mainnet--------------
  plugins: [
    new webpack.DefinePlugin({
      'process.env.ETH_NETWORK': JSON.stringify('mainnet'),
    }),
    new webpack.DefinePlugin({
      'process.env.UNI_GRAPH': JSON.stringify('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3'),
    }),
    new webpack.DefinePlugin({
      'process.env.DCA_GRAPH': JSON.stringify('https://api.thegraph.com/subgraphs/name/alejoamiras/dca-v1'),
    }),
    new webpack.DefinePlugin({
      'process.env.ETHERSCAN_API': JSON.stringify('4UTUC6B8A4X6Z3S1PVVUUXFX6IVTFNQEUF'),
    }),
    new webpack.DefinePlugin({
      'process.env.FACTORY_ADDRESS': JSON.stringify('0xaC4a40a995f236E081424D966F1dFE014Fe0e98A'),
    }),
  ],
});
