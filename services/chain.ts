
import scrollTestTokens from '~/static/tokens/scroll_test_tokens.json'
import polygonTestTokens from  '~/static/tokens/polygon_test_tokens.json'
import berachainTestTokens from  '~/static/tokens/berachain_test_tokens.json'
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
  }
  tokens: Token[] = []
  constructor(args: Partial<Network>) {
    Object.assign(this, args)
    makeAutoObservable(this)
  }
}


export const PolygonTestNetwork =  new Network({
  chainId: '0x13881',
  rpcUrls: ['https://polygon-mumbai-pokt.nodies.app'],
  chainName: 'Mumbai',
  blockExplorerUrls:['https://mumbai.polygonscan.com'],
  nativeCurrency: {
    symbol:'MATIC',
    decimals: 18
  },
  label: 'Polygon',
  contracts: {
    routerV2: new RouterV2Contract({
      address: '0x2ef225538c9FcE4641e038Fd6FA64cA5519cF971',
    }),
    factory: new FactoryContract({
      address: '0x333bB9e7Aa8E02017E92cBAe2A8D500be7c0B95F'
    }),
  },
  tokens: polygonTestTokens.map((t: any) => new Token(t))
})


export const BerachainTestNetwork =  new Network({
  chainId: '0x138d5',
  rpcUrls: ['https://artio.rpc.berachain.com/'],
  chainName: 'Berachain Testnet',
  blockExplorerUrls:['https://artio.beratrail.io/'],
  nativeCurrency: {
    symbol:'BERA',
    decimals: 18
  },
  label: 'Berachain',
  contracts: {
    routerV2: new RouterV2Contract({
      address: '0x51e4fF69060CD62dE1a9374799a0BddeB55cb1E4',
    }),
    factory: new FactoryContract({
      address: '0x5C4cDd0160c0CB4C606365dD98783064335A9ce0'
    }),
  },
  tokens: berachainTestTokens.map((t: any) => new Token(t))
})

export const ScrollTestNetwork =  new Network({
  chainId: '0x8274f',
  rpcUrls: ['https://scroll-sepolia.blockpi.network/v1/rpc/public'],
  chainName: 'Scroll Sepolia Testnet',
  blockExplorerUrls:['https://sepolia-blockscout.scroll.io'],
  nativeCurrency: {
    symbol:'ETH',
    decimals: 18
  },
  label: 'Scroll',
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
  PolygonTestNetwork,
  BerachainTestNetwork,
  ScrollTestNetwork,
] : []

