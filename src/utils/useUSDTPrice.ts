import { ChainId, Currency, currencyEquals, JSBI, Price, WETH } from '@daoswap-heco/daoswap-sdk'
import { useMemo } from 'react'
import { USDT } from '../constants'
import { PairState, usePairs } from '../data/Reserves'
import { useActiveWeb3React } from '../hooks'
import { wrappedCurrency } from './wrappedCurrency'

/**
 * Returns the price in USDT of the input currency
 * @param currency currency to compute the USDT price of
 */
export default function useUSDTPrice(currency?: Currency): Price | undefined {
  const { chainId } = useActiveWeb3React()
  const wrapped = wrappedCurrency(currency, chainId)
  const tokenPairs: [Currency | undefined, Currency | undefined][] = useMemo(
    () => [
      [
        chainId && wrapped && currencyEquals(WETH[chainId], wrapped) ? undefined : currency,
        chainId ? WETH[chainId] : undefined
      ],
      [wrapped?.equals(USDT) ? undefined : wrapped, chainId === ChainId.MAINNET ? USDT : undefined],
      [chainId ? WETH[chainId] : undefined, chainId === ChainId.MAINNET ? USDT : undefined]
    ],
    [chainId, currency, wrapped]
  )
  const [[ethPairState, ethPair], [usdtPairState, usdtPair], [usdtEthPairState, usdtEthPair]] = usePairs(tokenPairs)

  return useMemo(() => {
    if (!currency || !wrapped || !chainId) {
      return undefined
    }
    // handle weth/eth
    if (wrapped.equals(WETH[chainId])) {
      if (usdtPair) {
        const price = usdtPair.priceOf(WETH[chainId])
        return new Price(currency, USDT, price.denominator, price.numerator)
      } else {
        return undefined
      }
    }
    // handle usdt
    if (wrapped.equals(USDT)) {
      return new Price(USDT, USDT, '1', '1')
    }

    const ethPairETHAmount = ethPair?.reserveOf(WETH[chainId])
    const ethPairETHUSDTValue: JSBI =
      ethPairETHAmount && usdtEthPair ? usdtEthPair.priceOf(WETH[chainId]).quote(ethPairETHAmount).raw : JSBI.BigInt(0)

    // all other tokens
    // first try the usdt pair
    if (usdtPairState === PairState.EXISTS && usdtPair && usdtPair.reserveOf(USDT).greaterThan(ethPairETHUSDTValue)) {
      const price = usdtPair.priceOf(wrapped)
      return new Price(currency, USDT, price.denominator, price.numerator)
    }
    if (ethPairState === PairState.EXISTS && ethPair && usdtEthPairState === PairState.EXISTS && usdtEthPair) {
      if (usdtEthPair.reserveOf(USDT).greaterThan('0') && ethPair.reserveOf(WETH[chainId]).greaterThan('0')) {
        const ethUsdcPrice = usdtEthPair.priceOf(USDT)
        const currencyEthPrice = ethPair.priceOf(WETH[chainId])
        const usdtPrice = ethUsdcPrice.multiply(currencyEthPrice).invert()
        return new Price(currency, USDT, usdtPrice.denominator, usdtPrice.numerator)
      }
    }
    return undefined
  }, [chainId, currency, ethPair, ethPairState, usdtEthPair, usdtEthPairState, usdtPair, usdtPairState, wrapped])
}
