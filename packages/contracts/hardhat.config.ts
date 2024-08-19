import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "hardhat-gas-reporter";
import "solidity-coverage";
import dotenv from "dotenv";
import type { HttpNetworkUserConfig } from "hardhat/types";

// Load environment variables.
dotenv.config();
const { INFURA_KEY, MNEMONIC, ETHERSCAN_API_KEY, PK } = process.env;

import "./tasks/setup";
import "./tasks/deploy-mastercopy";
import "./tasks/extract-mastercopy";
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
    goerli: {
      ...sharedNetworkConfig,
      url: `https://goerli.infura.io/v3/${INFURA_KEY}`,
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
  },
  namedAccounts: {
    deployer: 0,
  },
  mocha: {
    timeout: 2000000,
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};
