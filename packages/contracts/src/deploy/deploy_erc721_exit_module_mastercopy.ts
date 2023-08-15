import { computeTargetAddress, deployMastercopy } from "@gnosis.pm/zodiac";
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

  const args = [
    FirstAddress,
    FirstAddress,
    FirstAddress,
    FirstAddress,
    FirstAddress,
  ];

  const { address, isDeployed } = await computeTargetAddress(
    deployer,
    ExitERC721,
    args,
    SaltZero
  );

  if (isDeployed) {
    console.log("ExitERC721 already deployed to:", address);
  } else {
    await deployMastercopy(deployer, ExitERC721, args, SaltZero);
    console.log("ExitERC721 was deployed to:", address);
  }

  hre.deployments.save("ExitERC721", {
    abi: CONTRACT_ARTIFACT.abi,
    address: address,
  });
};

deploy.tags = ["erc721-exit-module"];
export default deploy;
