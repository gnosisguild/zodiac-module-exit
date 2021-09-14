import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { deploySingletonContract } from "@gnosis.pm/zodiac";

import { bytecode as ExitByteCode } from "../../build/artifacts/contracts/ExitModule.sol/Exit.json";
const FirstAddress = "0x0000000000000000000000000000000000000001";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const Exit = await hre.ethers.getContractFactory("Exit");
  const args = [
    FirstAddress,
    FirstAddress,
    FirstAddress,
    FirstAddress,
    FirstAddress,
  ];
  const encodedParams = Exit.interface.encodeDeploy(args);

  const deploymentBytecode = hre.ethers.utils.hexConcat([
    ExitByteCode,
    encodedParams,
  ]);
  await deploySingletonContract(deploymentBytecode, "0xabbbb", hre);
};

deploy.tags = ["exit-module"];
export default deploy;
