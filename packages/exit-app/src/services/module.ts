import { BigNumber, ethers } from 'ethers'
import { Erc20__factory, ZodiacModuleExit__factory } from '../contracts/types'
import { Call, Contract, Provider } from 'ethcall'

export async function getExitModule(provider: ethers.providers.BaseProvider, module: string) {
  const ethcallProvider = new Provider()
  await ethcallProvider.init(provider)

  const exit = new Contract(module, ZodiacModuleExit__factory.abi)
  const txs: Call[] = [exit.circulatingSupply(), exit.designatedToken(), exit.getCirculatingSupply()]
  const results = await ethcallProvider.tryAll(Object.values(txs))

  return {
    circulatingSupplyAddress: results[0] as string,
    designatedToken: results[1] as string,
    circulatingSupply: results[2] as BigNumber,
  }
}

export async function getToken(provider: ethers.providers.BaseProvider, token: string) {
  const ethcallProvider = new Provider()
  await ethcallProvider.init(provider)

  const cs = new Contract(token, Erc20__factory.abi)
  const txs: Call[] = [cs.symbol(), cs.decimals()]
  const results = await ethcallProvider.tryAll(Object.values(txs))

  return {
    address: token,
    symbol: results[0] as string,
    decimals: results[1] as number,
  }
}

export async function getTokenBalance(provider: ethers.providers.BaseProvider, token: string, wallet: string) {
  const contract = Erc20__factory.connect(token, provider)
  return contract.balanceOf(wallet)
}
