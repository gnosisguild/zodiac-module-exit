import { task } from "hardhat/config";
import { verifyMastercopiesFromArtifact } from "zodiac-core";

const { ETHERSCAN_API_KEY } = process.env;

task(
  "mastercopies:verify",
  "Verifies all mastercopies from the artifacts file, in the block explorer corresponding to the current network"
).setAction(async (_, hre) => {
  if (!ETHERSCAN_API_KEY) {
    throw new Error("Missing ENV ETHERSCAN_API_KEY");
  }

  await verifyMastercopiesFromArtifact({
    apiUrl: String((await hre.ethers.provider.getNetwork()).chainId),
    apiKey: ETHERSCAN_API_KEY,
  });
});
