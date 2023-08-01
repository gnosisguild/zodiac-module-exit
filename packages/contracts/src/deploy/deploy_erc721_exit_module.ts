import { deployMastercopy } from "@gnosis.pm/zodiac";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import CONTRACT_ARTIFACT from "../../build/artifacts/contracts/ExitModule/ExitERC721Module.sol/ExitERC721.json";

const SaltZero =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const FirstAddress = "0x0000000000000000000000000000000000000001";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts } = hre;
  const { deployer: deployerAddress } = await getNamedAccounts();
  const deployer = hre.ethers.provider.getSigner(deployerAddress);

  const ExitERC721 = await hre.ethers.getContractFactory("ExitERC721");

  const address = await deployMastercopy(
    deployer,
    ExitERC721,
    [FirstAddress, FirstAddress, FirstAddress, FirstAddress, FirstAddress],
    SaltZero
  );

  console.log("ExitERC721 deployed to:", address);

  hre.deployments.save("ExitERC721", {
    abi: CONTRACT_ARTIFACT.abi,
    address: address,
  });
};

deploy.tags = ["erc721-exit-module"];
export default deploy;
