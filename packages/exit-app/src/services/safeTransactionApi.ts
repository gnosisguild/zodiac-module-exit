import axios from 'axios'
import { SafeAssets, TokenAsset } from '../store/main/models'

export class SafeTransactionApi {
  private baseUrl = 'https://safe-client.safe.global'
  private chainId: number
  private safe: string

  public currency = 'USD'

  constructor(_chainId: number, _safe: string) {
    this.chainId = _chainId
    this.safe = _safe
  }

  static create(_chainId: number, _safe: string) {
    return new this(_chainId, _safe)
  }

  private getBasePath() {
    return `v1/chains/${this.chainId}/safes/${this.safe}`
  }

  getAssets(currency = 'USD') {
    const path = this.getBasePath() + `/balances/${currency}/?exclude_spam=true&trusted=false`
    return this.get<SafeAssets>(path).then((result) => {
      return {
        ...result.data,
        items: result.data.items.map((item: Omit<TokenAsset, 'gas'>): TokenAsset => ({ ...item, gas: '0' })),
      }
    })
  }

  private get<T>(path: string) {
    const url = new URL(path, this.baseUrl)
    return axios.get<T>(url.toString())
  }
}
