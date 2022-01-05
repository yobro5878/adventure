require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-truffle5");
require('solidity-coverage');

const credentials = require('./credentials.json');

module.exports = {
  solidity: {
    version: "0.8.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    hardhat: {
      forking: {
        url: credentials.rpc,
      },
    },
  },
  mocha: {
    timeout: 200000
  }
};
