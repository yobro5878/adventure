const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");
const credentials = require("./credentials.json");

const provider = new HDWalletProvider(credentials.mnemonic, credentials.rpc);
const web3 = new Web3(provider);

async function ownersOfCards(web3) {
  const abi = require("./abis/ac.json");
  const address = "0x329Fd5E0d9aAd262b13CA07C87d001bec716ED39";
  const contract = new web3.eth.Contract(abi, address);
  const maxCard = 4902;
  const block = 13933630;

  for (let i = 1; i < maxCard; i++) {
    let owner = await contract.methods.ownerOf(i).call(null, block);
    console.log(`${i};${owner}`);
  }
  console.log("DONE");
}

async function run() {

  await ownersOfCards(web3);

  provider.engine.stop();
}

run();
