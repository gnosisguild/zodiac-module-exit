import { ethers } from 'ethers'

export interface IExit {
  needsApproval(): Promise<boolean>
  approve(): Promise<ethers.PopulatedTransaction>
  exit(): Promise<ethers.PopulatedTransaction>
}
