import localforage from 'localforage'

export enum CACHE_TYPE {
  IS_EXIT_MODULE = 'IS_EXIT_MODULE',
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
}

const cacheStorage = localforage.createInstance({
  name: 'otherName',
})

export function getCacheHash(type: CACHE_TYPE, ...params: string[]) {
  return [type, ...params].join('_')
}

export function readCache(hash: string) {
  return cacheStorage.getItem(hash)
}

export function writeCache(hash: string, value: unknown) {
  return cacheStorage.setItem(hash, value)
}
