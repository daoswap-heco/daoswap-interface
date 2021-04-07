import { ChainId } from '@daoswap-heco/daoswap-sdk'
import MULTICALL_ABI from './abi.json'

const MULTICALL_NETWORKS: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441',
  [ChainId.TESTNET]: '0x7aF326B6351C8A9b8fb8CD205CBe11d4Ac5FA836'
}

export { MULTICALL_ABI, MULTICALL_NETWORKS }
