import localforage from 'localforage'
import memoryDriver from 'localforage-memoryStorageDriver'
import { setup } from 'axios-cache-adapter'
import { AxiosInstance } from 'axios'

async function configure() {
  await localforage.defineDriver(memoryDriver)

  const forageStore = localforage.createInstance({
    driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE, memoryDriver._driver],
    name: 'zodiac-exit-app',
  })

  return setup({
    cache: {
      maxAge: 30 * 24 * 60 * 1000, // 30 days
      store: forageStore,
    },
  })
}

let httpCacheClient: AxiosInstance

configure()
  .then((client) => (httpCacheClient = client))
  .catch(console.error)

export { httpCacheClient }
