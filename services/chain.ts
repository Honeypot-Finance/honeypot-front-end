import scrollTestTokens from '~/static/tokens/scroll_test_tokens.json'
import { Token } from './contract/token'
import { RouterV2Contract } from './contract/routerv2-contract'
import { FactoryContract } from './contract/factory-contract'
import { makeAutoObservable } from '~/lib/observer'

export class Network {
  chainId!: string
  rpcUrls!: string[]
  chainName!: string
  blockExplorerUrls:string[]
  nativeCurrency: {
    symbol: string
    decimals: number
  }
  label!: string
  contracts!: {
    routerV2: RouterV2Contract
    factory: FactoryContract
    faucet?: FactoryContract
  }
  tokens: Token[] = []
  constructor(args: Partial<Network>) {
    Object.assign(this, args)
    makeAutoObservable(this)
  }
}


// export const PolygonTestNetwork =  new Network({
//   chainId: '0x5a2',
//   rpcUrls: ['https://api.zan.top/node/v1/polygonzkevm/testnet/public'],
//   chainName: 'Polygon zkEVM Testnet',
//   blockExplorerUrls:['https://explorer.public.zkevm-test.net'],
//   nativeCurrency: {
//     symbol:'ETH',
//     decimals: 18
//   },
//   label: 'Polygon',
//   contracts: {
//     routerV2: new RouterV2Contract({
//       address: '0xf18c4ed3250f4A14279F5f79eD00b5A1Cd0391B0',
//     }),
//     factory: new FactoryContract({
//       address: '0x756Afd4cA8cE2ef38bD16b8BBB9e39e5e72D1c8c'
//     }),
//     faucet: new FactoryContract({
//       address: '0x756Afd4cA8cE2ef38bD16b8BBB9e39e5e72D1c8c'
//     })
//   },
//   tokens: scrollTestTokens.map((t: any) => new Token(t))
// })


// export const BerachainTestNetwork =  new Network({
//   chainId: '0x138d5',
//   rpcUrls: ['https://artio.rpc.berachain.com/'],
//   chainName: 'Berachain Testnet',
//   blockExplorerUrls:['https://artio.beratrail.io/'],
//   nativeCurrency: {
//     symbol:'BERA',
//     decimals: 18
//   },
//   label: 'Berachain',
//   contracts: {
//     routerV2: new RouterV2Contract({
//       address: '0xf18c4ed3250f4A14279F5f79eD00b5A1Cd0391B0',
//     }),
//     factory: new FactoryContract({
//       address: '0x756Afd4cA8cE2ef38bD16b8BBB9e39e5e72D1c8c'
//     }),
//     faucet: new FactoryContract({
//       address: '0x756Afd4cA8cE2ef38bD16b8BBB9e39e5e72D1c8c'
//     })
//   },
//   tokens: scrollTestTokens.map((t: any) => new Token(t))
// })

export const ScrollTestNetwork =  new Network({
  chainId: '0x8274f',
  rpcUrls: ['https://scroll-sepolia.blockpi.network/v1/rpc/public'],
  chainName: 'Scroll Sepolia Testnet',
  blockExplorerUrls:['https://sepolia-blockscout.scroll.io'],
  nativeCurrency: {
    symbol:'ETH',
    decimals: 18
  },
  label: 'Testnet',
  contracts: {
    routerV2: new RouterV2Contract({
      address: '0xf18c4ed3250f4A14279F5f79eD00b5A1Cd0391B0',
    }),
    factory: new FactoryContract({
      address: '0x756Afd4cA8cE2ef38bD16b8BBB9e39e5e72D1c8c'
    }),
  },
  tokens: scrollTestTokens.map((t: any) => new Token(t))
})


export const networks = process.env.CHAIN_ENV === 'test' ? [
  ScrollTestNetwork,
  // BerachainTestNetwork,
  // PolygonTestNetwork,
] : []

export const test = 1
