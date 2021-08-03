# SafeExit Setup Guide

This guide shows how to setup the SafeExit module with a Gnosis Safe on the Rinkeby testnetwork.

## Prerequisites

To start the process you need to create a Safe on the Rinkeby test network (e.g. via https://rinkeby.gnosis-safe.io).

For the hardhat tasks to work the environment needs to be properly configured. See the [sample env file](../.env.sample) for more information.

In order to test the exit execution, this guide will use some ERC20 tokens that can be requested on https://app.compound.finance/, with the following steps: (**Make sure you are on rinkeby**) - Connect wallet, click on any token in the supply markets list, a modal will appear, and click on "Faucet"; this will trigger a transaction that will send you some token to your account.

Request at least two tokens and send them to the Safe Address; then, in order to test the exit functionality, a designated token will be needed, for this, we can deploy one and mint some using the following hardhat command:

`yarn hardhat deployDesignatedToken --user RECEIVER_OF_TOKENS --network rinkeby`

Note: In this script, one (1) token is minted to the address passed as the user parameter, if nothing is given then the signer of transaction will receive the minted token

## Setting up the module

The first step is to deploy the module. Every Safe will have their own module. The module is linked to a Safe (called executor in the contract). The Safe cannot be changed after deployment.

### Deploying the module

A hardhat task can be used to deploy a Safe Exit instance. This setup task requires the following parameters:

### Enabling the module

To allow the SafeExit module to actually work it is required to enable it on the Safe that it is connected to. For this it is possible to use the Transaction Builder on https://rinkeby.gnosis-safe.io. For this you can follow our tutorial on [adding a module](https://help.gnosis-safe.io/en/articles/4934427-add-a-module).

### Executing the exit
