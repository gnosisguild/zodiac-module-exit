import { httpCacheClient } from './http'

function getIPFSUrl(tokenUri: string) {
  if (tokenUri.startsWith('ipfs://')) {
    return 'https://ipfs.io/ipfs/' + tokenUri.substr(7)
  }
  return tokenUri
}

export async function getTokenImage(tokenUri: string) {
  if (!tokenUri) return
  const url = getIPFSUrl(tokenUri)
  try {
    const response = await httpCacheClient.get(url)
    const metadata = response.data
    const img = metadata.image || metadata.media?.uri
    if (img) return getIPFSUrl(img)
  } catch (err) {
    console.warn('failed to get image for tokenUri: ', tokenUri)
  }
  return
}
