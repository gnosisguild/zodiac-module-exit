import { task } from "hardhat/config";

import { storeMastercopyArtifact } from "zodiac-core";

import packageJson from "../package.json";

const AddressOne = "0x0000000000000000000000000000000000000001";

task(
  "extract-current",
  "Extracts and persists current mastercopy build artifacts"
).setAction(async (_, hre) => {
  storeMastercopyArtifact({
    contractVersion: packageJson.version,
    contractName: "ExitERC20",
    compilerInput: await hre.run("verify:etherscan-get-minimal-input", {
      sourceName: "contracts/ExitModule/ExitERC20Module.sol",
    }),
    constructorArgs: {
      types: ["address", "address", "address", "address", "address"],
      values: [AddressOne, AddressOne, AddressOne, AddressOne, AddressOne],
    },
    salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
  });

  storeMastercopyArtifact({
    contractVersion: packageJson.version,
    contractName: "ExitERC721",
    compilerInput: await hre.run("verify:etherscan-get-minimal-input", {
      sourceName: "contracts/ExitModule/ExitERC721Module.sol",
    }),
    constructorArgs: {
      types: ["address", "address", "address", "address", "address"],
      values: [AddressOne, AddressOne, AddressOne, AddressOne, AddressOne],
    },
    salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
  });
});
