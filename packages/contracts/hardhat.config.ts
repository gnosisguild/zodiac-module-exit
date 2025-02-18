import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "hardhat-gas-reporter";
import "solidity-coverage";
import dotenv from "dotenv";
import type { HttpNetworkUserConfig } from "hardhat/types";

// Load environment variables.
dotenv.config();
const { INFURA_KEY, MNEMONIC, ETHERSCAN_API_KEY, PK } = process.env;

import "./tasks/deploy-mastercopies";
import "./tasks/deploy-mastercopy";
import "./tasks/extract-mastercopy";
import "./tasks/verify-mastercopies";
import "./tasks/verify-mastercopy";

const DEFAULT_MNEMONIC =
  "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";

const sharedNetworkConfig: HttpNetworkUserConfig = {};
if (PK) {
  sharedNetworkConfig.accounts = [PK];
} else {
  sharedNetworkConfig.accounts = {
    mnemonic: MNEMONIC || DEFAULT_MNEMONIC,
  };
}

export default {
  paths: {
    artifacts: "build/artifacts",
    cache: "build/cache",
    deploy: "src/deploy",
    sources: "contracts",
  },
  solidity: {
    version: "0.8.6",
  },
  networks: {
    mainnet: {
      ...sharedNetworkConfig,
      url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
    },
    gnosis: {
      ...sharedNetworkConfig,
      url: "https://rpc.gnosischain.com",
    },
    matic: {
      ...sharedNetworkConfig,
      url: "https://rpc-mainnet.maticvigil.com",
    },
    sepolia: {
      ...sharedNetworkConfig,
      url: `https://sepolia.infura.io/v3/${INFURA_KEY}`,
    },
    "lisk-sepolia": {
      ...sharedNetworkConfig,
      chainId: 4202,
      url: "https://rpc.sepolia-api.lisk.com",
      gasPrice: 1000000000,
    },
    "bob-sepolia": {
      ...sharedNetworkConfig,
      chainId: 808813,
      url: "https://bob-sepolia.rpc.gobob.xyz/",
      gasPrice: 1000000000,
    },
  },
  namedAccounts: {
    deployer: 0,
  },
  mocha: {
    timeout: 2000000,
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      // Use "ETHERSCAN_API_KEY" as a placeholder, because Blockscout doesn't need a real API key, and Hardhat will complain if this property isn't set.
      "lisk-sepolia": ETHERSCAN_API_KEY,
      "bob-sepolia": ETHERSCAN_API_KEY,
    } as Record<string, string>,
    customChains: [
      {
        network: "lisk-sepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com",
        },
      },
      {
        network: "bob-sepolia",
        chainId: 808813,
        urls: {
          apiURL: "https://bob-sepolia.explorer.gobob.xyz/api",
          browserURL: "https://bob-sepolia.explorer.gobob.xyz",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
};
