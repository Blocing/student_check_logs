const { FileSystemWallet, Gateway, Wallets } = require("fabric-network");
const path = require("path");
const ccpPath = path.resolve(__dirname, "..", "..", "first-network", "connection-org1.json");

async function send(type, func, args) {
  try {
    const walletPath = path.join(process.cwd(), "wallet");
    const wallet = new FileSystemWallet(walletPath);
    console.log(`wallet path: ${walletPath}`);

    const userExists = await wallet.exists("user1");
    if (!userExists) {
      console.log('An identity for the user "user1" does not exist in the wallet');
      console.log("Run the registerUser.js application before retrying");
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: "user1", discovery: { enabled: true, asLocalhost: true } });

    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("blocing");

    // type 1: invoke / type 0: query
    if (type) {
      await contract.submitTransaction(func, ...args);
      console.log("Transaction has been submitted");
      await gateway.disconnect();
      return "success";
    } else {
      const result = await contract.evaluateTransaction(func, ...args);
      console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
      let obj = JSON.parse(result);
      return obj;
    }
  } catch (e) {
    console.error(`Failed to submit transaction: ${e}`);
    return e;
  }
}

// send(1, "setCard", ["did:sov:987654321zzawwq", "10","0","2020-11-28 13:13:13"])
// send(0, "getCard", ["did:sov:77777Qa2TiPmNkDKhNVc9n"])

module.exports = {
  send,
};
// 
