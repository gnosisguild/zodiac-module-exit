import { task, types } from "hardhat/config";
import {
  readMastercopy,
  verifyAllMastercopies,
} from "@gnosis-guild/zodiac-core";
import path from "path";
import fs from "fs";

const { ETHERSCAN_API_KEY } = process.env;

task(
  "verify:mastercopy",
  "Verifies all mastercopies from the artifacts file, in the block explorer corresponding to the current network"
)
  .addOptionalParam(
    "contractName",
    "The name of the contractName to verify",
    types.string
  )
  .addFlag(
    "current",
    "Verify the latest version from disk instead of using mastercopies.json" //TODO: Improve the docs
  )
  .setAction(async ({ current, contractName }, hre) => {
    if (!ETHERSCAN_API_KEY) {
      throw new Error("Missing ENV ETHERSCAN_API_KEY");
    }

    const chainId = String((await hre.ethers.provider.getNetwork()).chainId);

    if (current && contractName) {
      const latestArtifact = readMastercopy({
        contractName,
      });
      const tempFilePath = path.join(
        hre.config.paths.cache,
        "latest-mastercopy.json"
      );
      fs.writeFileSync(tempFilePath, JSON.stringify([latestArtifact], null, 2));

      const { address } = latestArtifact;
      console.log(`Verifying ${contractName} at address ${address}...`);

      await verifyAllMastercopies({
        apiUrlOrChainId: chainId,
        apiKey: ETHERSCAN_API_KEY,
        mastercopyArtifactsFile: tempFilePath,
      });
      fs.unlinkSync(tempFilePath);
    } else {
      await verifyAllMastercopies({
        apiUrlOrChainId: chainId,
        apiKey: ETHERSCAN_API_KEY,
      });
    }
  });
