import { deployMastercopy, computeTargetAddress } from "@gnosis.pm/zodiac";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import CONTRACT_ARTIFACT from "../../build/artifacts/contracts/CirculatingSupply/CirculatingSupplyERC20.sol/CirculatingSupplyERC20.json";

const SaltZero =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const FirstAddress = "0x0000000000000000000000000000000000000001";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts } = hre;
  const { deployer: deployerAddress } = await getNamedAccounts();
  const deployer = hre.ethers.provider.getSigner(deployerAddress);

  const CirculatingSupplyERC20 = await hre.ethers.getContractFactory(
    "CirculatingSupplyERC20"
  );

  const args = [FirstAddress, FirstAddress, []];

  const { address, isDeployed } = await computeTargetAddress(
    deployer,
    CirculatingSupplyERC20,
    args,
    SaltZero
  );

  if (isDeployed) {
    console.log("CirculatingSupplyERC20 already deployed to:", address);
  } else {
    await deployMastercopy(deployer, CirculatingSupplyERC20, args, SaltZero);
    console.log("CirculatingSupplyERC20 was deployed to:", address);
  }

  hre.deployments.save("CirculatingSupplyERC20", {
    abi: CONTRACT_ARTIFACT.abi,
    address: address,
  });
};

deploy.tags = ["circulating-supply"];
export default deploy;
