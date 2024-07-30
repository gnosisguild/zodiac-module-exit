import { deployMastercopy } from "zodiac-core";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import CONTRACT_ARTIFACT from "../../build/artifacts/contracts/CirculatingSupply/CirculatingSupplyERC20.sol/CirculatingSupplyERC20.json";

import createAdapter from "./createEIP1193";

const SaltZero =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const FirstAddress = "0x0000000000000000000000000000000000000001";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts } = hre;
  const { deployer: deployerAddress } = await getNamedAccounts();
  const deployer = await hre.ethers.provider.getSigner(deployerAddress);

  const CirculatingSupplyERC20 = await hre.ethers.getContractFactory(
    "CirculatingSupplyERC20"
  );

  const { noop, address } = await deployMastercopy({
    bytecode: CirculatingSupplyERC20.bytecode,
    constructorArgs: {
      types: ["address", "address", "address[]"],
      values: [FirstAddress, FirstAddress, []],
    },
    salt: SaltZero,
    provider: createAdapter({
      provider: hre.network.provider,
      signer: deployer,
    }),
  });

  if (noop) {
    console.log("CirculatingSupplyERC20 already deployed to:", address);
  } else {
    console.log("CirculatingSupplyERC20 was deployed to:", address);
  }

  hre.deployments.save("CirculatingSupplyERC20", {
    abi: CONTRACT_ARTIFACT.abi,
    address: address,
  });
};

deploy.tags = ["circulating-supply"];
export default deploy;
