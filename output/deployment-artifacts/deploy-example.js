
// Web3.js deployment example
const Web3 = require('web3');
const contract = require('./deployment-artifacts/TestToken.json');

async function deploy() {
  const web3 = new Web3('YOUR_RPC_URL');
  const account = web3.eth.accounts.privateKeyToAccount('YOUR_PRIVATE_KEY');
  
  const TestToken = new web3.eth.Contract(contract.abi);
  
  const deployment = TestToken.deploy({
    data: contract.bytecode
  });
  
  const gas = await deployment.estimateGas();
  
  const deployedContract = await deployment.send({
    from: account.address,
    gas: gas
  });
  
  console.log('Contract deployed at:', deployedContract.options.address);
}
