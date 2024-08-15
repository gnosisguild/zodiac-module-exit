import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { deployMastercopy } from "@gnosis-guild/zodiac-core";

import CONTRACT_ARTIFACT from "../../build/artifacts/contracts/ExitModule/ExitERC20Module.sol/ExitERC20.json";

import createAdapter from "./createEIP1193";

const SaltZero =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const FirstAddress = "0x0000000000000000000000000000000000000001";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts } = hre;
  const { deployer: deployerAddress } = await getNamedAccounts();
  const deployer = await hre.ethers.provider.getSigner(deployerAddress);

  const ExitERC20 = await hre.ethers.getContractFactory("ExitERC20");

  const args = [
    FirstAddress,
    FirstAddress,
    FirstAddress,
    FirstAddress,
    FirstAddress,
  ];
  const { noop, address } = await deployMastercopy({
    bytecode: ExitERC20.bytecode,
    constructorArgs: {
      types: ["address", "address", "address", "address", "address"],
      values: args,
    },
    salt: SaltZero,
    provider: createAdapter({
      provider: hre.network.provider,
      signer: deployer,
    }),
  });

  if (noop) {
    console.log("ExitERC20 already deployed to:", address);
  } else {
    console.log("ExitERC20 was deployed to:", address);
  }

  hre.deployments.save("ExitERC20", {
    abi: CONTRACT_ARTIFACT.abi,
    address: address,
  });
};

deploy.tags = ["exit-module"];
export default deploy;
