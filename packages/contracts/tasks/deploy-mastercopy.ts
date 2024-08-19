import { Signer } from "ethers";
import { task, types } from "hardhat/config";
import { EthereumProvider } from "hardhat/types";

import {
  EIP1193Provider,
  deployMastercopy,
  deployAllMastercopies,
  readMastercopy,
} from "@gnosis-guild/zodiac-core";

task(
  "deploy:mastercopy",
  "For every version entry on the artifacts file, deploys a mastercopy into the current network"
)
  .addOptionalParam(
    "contractName",
    "The name of the contractName to deploy",
    types.string
  )
  .addFlag(
    "current",
    "Deploy the latest version from disk instead of using mastercopies.json" //TODO: Improve the docs
  )
  .setAction(async ({ current, contractName }, hre) => {
    console.log("contractName", contractName);
    const [signer] = await hre.ethers.getSigners();
    const provider = createEIP1193(hre.network.provider, signer);
    if (current) {
      // Logic to deploy the latest version from disk
      await deployLatestMastercopyFromDisk(provider, contractName);
    } else {
      // using mastercopies.json
      await deployAllMastercopies({
        provider,
      });
    }
  });

function createEIP1193(
  provider: EthereumProvider,
  signer: Signer
): EIP1193Provider {
  return {
    request: async ({ method, params }) => {
      if (method == "eth_sendTransaction") {
        const { hash } = await signer.sendTransaction((params as any[])[0]);
        return hash;
      }

      return provider.request({ method, params });
    },
  };
}

async function deployLatestMastercopyFromDisk(
  provider: EIP1193Provider,
  contract: string
) {
  const latestArtifact = readMastercopy({
    contractName: contract,
  });

  const { address, noop } = await deployMastercopy({
    ...latestArtifact,
    provider,
  });
  const { contractName, contractVersion } = latestArtifact;
  if (noop) {
    console.log(
      `🔄 ${contractName}@${contractVersion}: Already deployed at ${address}`
    );
  } else {
    console.log(
      `🚀 ${contractName}@${contractVersion}: Successfully deployed at ${address}`
    );
  }
}
