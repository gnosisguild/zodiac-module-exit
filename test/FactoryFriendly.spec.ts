import { expect } from "chai";
import hre, { deployments, ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { AbiCoder } from "ethers/lib/utils";
import { BigNumber } from "ethers";

const FIRST_ADDRESS = "0x0000000000000000000000000000000000000001";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const saltNonce = "0xfa";

describe("Module works with factory", () => {
  const timeout = 60;
  const cooldown = 60;
  const expiration = 120;
  const bond = BigNumber.from(10000);
  const templateId = BigNumber.from(1);

  const paramsTypes = ["address", "address", "address", "address"];

  const baseSetup = deployments.createFixture(async () => {
    await deployments.fixture();
    const Factory = await hre.ethers.getContractFactory("ModuleProxyFactory");
    const ExitModule = await hre.ethers.getContractFactory("Exit");
    const factory = await Factory.deploy();

    const masterCopy = await ExitModule.deploy(
      FIRST_ADDRESS,
      FIRST_ADDRESS,
      FIRST_ADDRESS,
      FIRST_ADDRESS
    );

    return { factory, masterCopy };
  });

  it("should throw because master copy is already initialized", async () => {
    const { masterCopy } = await baseSetup();
    const [executor, designatedToken, circulatingSupply] =
      await ethers.getSigners();

    const encodedParams = new AbiCoder().encode(paramsTypes, [
      executor.address,
      executor.address,
      designatedToken.address,
      circulatingSupply.address,
    ]);

    await expect(masterCopy.setUp(encodedParams)).to.be.revertedWith(
      "Module is already initialized"
    );
  });

  it("should deploy new dao module proxy", async () => {
    const { factory, masterCopy } = await baseSetup();
    const [executor, designatedToken, circulatingSupply] =
      await ethers.getSigners();
    const paramsValues = [
      executor.address,
      executor.address,
      designatedToken.address,
      circulatingSupply.address,
    ];
    const encodedParams = [new AbiCoder().encode(paramsTypes, paramsValues)];
    const initParams = masterCopy.interface.encodeFunctionData(
      "setUp",
      encodedParams
    );
    const receipt = await factory
      .deployModule(masterCopy.address, initParams, saltNonce)
      .then((tx: any) => tx.wait());

    // retrieve new address from event
    const {
      args: [newProxyAddress],
    } = receipt.events.find(
      ({ event }: { event: string }) => event === "ModuleProxyCreation"
    );

    const newProxy = await hre.ethers.getContractAt(
      "Exit",
      newProxyAddress
    );
    expect(await newProxy.designatedToken()).to.be.eq(designatedToken.address);
    expect(await newProxy.circulatingSupply()).to.be.eq(
      circulatingSupply.address
    );
  });
});
