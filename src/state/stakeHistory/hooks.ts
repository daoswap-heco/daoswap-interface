import { ChainId, CurrencyAmount, JSBI, Token, TokenAmount, WETH, Pair } from '@daoswap-heco/daoswap-sdk'
// import { ChainId, CurrencyAmount, JSBI, Token, TokenAmount, Pair } from '@daoswap-heco/daoswap-sdk'
import { useMemo } from 'react'
// TODO:Daoswap ERC20
// import { DAI, DOI_ROPSTEN, UNI, USDC, USDT, WBTC } from '../../constants'
// import { UNI, NTC_RINKEBY, DTC1_RINKEBY, DTC2_RINKEBY } from '../../constants'
import { UNI, DTC1_RINKEBY } from '../../constants'
// import { UNI } from '../../constants'
import { STAKING_REWARDS_INTERFACE } from '../../constants/abis/staking-rewards'
import { useActiveWeb3React } from '../../hooks'
import { NEVER_RELOAD, useMultipleContractSingleData } from '../multicall/hooks'
import { tryParseAmount } from '../swap/hooks'
import { useTranslation } from 'react-i18next'

// TODO:Daoswap Start Time
export const STAKING_GENESIS = 1608267600

// TODO:Daoswap Rewards Duration : unit - day
export const REWARDS_DURATION_DAYS = 1

// TODO add staking rewards addresses here
export const STAKING_REWARDS_INFO: {
  [chainId in ChainId]?: {
    tokens: [Token, Token]
    stakingRewardAddress: string
  }[]
} = {
  // [ChainId.MAINNET]: [
  //   {
  //     tokens: [WETH[ChainId.MAINNET], DAI],
  //     stakingRewardAddress: '0xa1484C3aa22a66C62b77E0AE78E15258bd0cB711'
  //   },
  //   {
  //     tokens: [WETH[ChainId.MAINNET], USDC],
  //     stakingRewardAddress: '0x7FBa4B8Dc5E7616e59622806932DBea72537A56b'
  //   },
  //   {
  //     tokens: [WETH[ChainId.MAINNET], USDT],
  //     stakingRewardAddress: '0x6C3e4cb2E96B01F4b866965A91ed4437839A121a'
  //   },
  //   {
  //     tokens: [WETH[ChainId.MAINNET], WBTC],
  //     stakingRewardAddress: '0xCA35e32e7926b96A9988f61d510E038108d8068e'
  //   }
  // ],
  // TODO:Daoswap 配置奖励池
  [ChainId.RINKEBY]: [
    // {
    //   tokens: [WETH[ChainId.RINKEBY], DTC1_RINKEBY],
    //   stakingRewardAddress: '0xddD330E6EbF40E8f1C8C5B8dfDf41C2113892E04'
    // }
    // {
    //   tokens: [WETH[ChainId.RINKEBY], DTC1_RINKEBY],
    //   stakingRewardAddress: '0xEd89304EfC6CdDc00b4635041356fAa8497e070C'
    // }
    // {
    //   tokens: [WETH[ChainId.RINKEBY], DTC1_RINKEBY],
    //   stakingRewardAddress: '0xAF3B86C625C0585f63C5246cc90ECb00c6A98556'
    // }
    // 下面常用池子
    // {
    //   tokens: [WETH[ChainId.RINKEBY], NTC_RINKEBY],
    //   stakingRewardAddress: '0x8a1858e0B41E98c591363FA3D3d7cd114B62F7bb'
    // },
    // {
    //   tokens: [WETH[ChainId.RINKEBY], DTC1_RINKEBY],
    //   stakingRewardAddress: '0x34f7f0563625e157a273DAb6AE9e5679Cf62F038'
    // },
    // {
    //   tokens: [NTC_RINKEBY, DTC1_RINKEBY],
    //   stakingRewardAddress: '0xABB18De1e6b538F7bbecF5036821c89Dbf4537D0'
    // },
    // {
    //   tokens: [DTC1_RINKEBY, DTC2_RINKEBY],
    //   stakingRewardAddress: '0x9B992c98339cc3730bA3458898BbeC58c2C83546'
    // }
    // {
    //   tokens: [WETH[ChainId.RINKEBY], DTC1_RINKEBY],
    //   stakingRewardAddress: '0x0E5DA7Cba443Ea3989c610194c0ee01F053b0505'
    // }
    {
      tokens: [WETH[ChainId.RINKEBY], DTC1_RINKEBY],
      stakingRewardAddress: '0x1097394f70E32EECf3160276011F3d188AA4465a'
    }
  ]
}

export interface StakingInfo {
  // the address of the reward contract
  stakingRewardAddress: string
  // the tokens involved in this pair
  tokens: [Token, Token]
  // the amount of token currently staked, or undefined if no account
  stakedAmount: TokenAmount
  // the amount of reward token earned by the active account, or undefined if no account
  earnedAmount: TokenAmount
  // the total amount of token staked in the contract
  totalStakedAmount: TokenAmount
  // the amount of token distributed per second to all LPs, constant
  totalRewardRate: TokenAmount
  // the current amount of token distributed to the active account per second.
  // equivalent to percent of total supply * reward rate
  rewardRate: TokenAmount
  // when the period ends
  periodFinish: Date | undefined
  // calculates a hypothetical amount of token distributed to the active account per second.
  getHypotheticalRewardRate: (
    stakedAmount: TokenAmount,
    totalStakedAmount: TokenAmount,
    totalRewardRate: TokenAmount
  ) => TokenAmount
}

// gets the staking info from the network for the active chain id
export function useStakingInfo(pairToFilterBy?: Pair | null): StakingInfo[] {
  const { chainId, account } = useActiveWeb3React()

  const info = useMemo(
    () =>
      chainId
        ? STAKING_REWARDS_INFO[chainId]?.filter(stakingRewardInfo =>
            pairToFilterBy === undefined
              ? true
              : pairToFilterBy === null
              ? false
              : pairToFilterBy.involvesToken(stakingRewardInfo.tokens[0]) &&
                pairToFilterBy.involvesToken(stakingRewardInfo.tokens[1])
          ) ?? []
        : [],
    [chainId, pairToFilterBy]
  )

  const uni = chainId ? UNI[chainId] : undefined

  const rewardsAddresses = useMemo(() => info.map(({ stakingRewardAddress }) => stakingRewardAddress), [info])

  const accountArg = useMemo(() => [account ?? undefined], [account])

  // get all the info from the staking rewards contracts
  const balances = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'balanceOf', accountArg)
  const earnedAmounts = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'earned', accountArg)
  const totalSupplies = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'totalSupply')

  // tokens per second, constants
  const rewardRates = useMultipleContractSingleData(
    rewardsAddresses,
    STAKING_REWARDS_INTERFACE,
    'rewardRate',
    undefined,
    NEVER_RELOAD
  )
  const periodFinishes = useMultipleContractSingleData(
    rewardsAddresses,
    STAKING_REWARDS_INTERFACE,
    'periodFinish',
    undefined,
    NEVER_RELOAD
  )

  return useMemo(() => {
    if (!chainId || !uni) return []

    return rewardsAddresses.reduce<StakingInfo[]>((memo, rewardsAddress, index) => {
      // these two are dependent on account
      const balanceState = balances[index]
      const earnedAmountState = earnedAmounts[index]

      // these get fetched regardless of account
      const totalSupplyState = totalSupplies[index]
      const rewardRateState = rewardRates[index]
      const periodFinishState = periodFinishes[index]

      if (
        // these may be undefined if not logged in
        !balanceState?.loading &&
        !earnedAmountState?.loading &&
        // always need these
        totalSupplyState &&
        !totalSupplyState.loading &&
        rewardRateState &&
        !rewardRateState.loading &&
        periodFinishState &&
        !periodFinishState.loading
      ) {
        if (
          balanceState?.error ||
          earnedAmountState?.error ||
          totalSupplyState.error ||
          rewardRateState.error ||
          periodFinishState.error
        ) {
          console.error('Failed to load staking rewards info')
          return memo
        }

        // get the LP token
        const tokens = info[index].tokens
        const dummyPair = new Pair(new TokenAmount(tokens[0], '0'), new TokenAmount(tokens[1], '0'))

        // check for account, if no account set to 0

        const stakedAmount = new TokenAmount(dummyPair.liquidityToken, JSBI.BigInt(balanceState?.result?.[0] ?? 0))
        const totalStakedAmount = new TokenAmount(dummyPair.liquidityToken, JSBI.BigInt(totalSupplyState.result?.[0]))
        const totalRewardRate = new TokenAmount(uni, JSBI.BigInt(rewardRateState.result?.[0]))

        const getHypotheticalRewardRate = (
          stakedAmount: TokenAmount,
          totalStakedAmount: TokenAmount,
          totalRewardRate: TokenAmount
        ): TokenAmount => {
          return new TokenAmount(
            uni,
            JSBI.greaterThan(totalStakedAmount.raw, JSBI.BigInt(0))
              ? JSBI.divide(JSBI.multiply(totalRewardRate.raw, stakedAmount.raw), totalStakedAmount.raw)
              : JSBI.BigInt(0)
          )
        }

        const individualRewardRate = getHypotheticalRewardRate(stakedAmount, totalStakedAmount, totalRewardRate)

        const periodFinishMs = periodFinishState.result?.[0]?.mul(1000)?.toNumber()

        memo.push({
          stakingRewardAddress: rewardsAddress,
          tokens: info[index].tokens,
          periodFinish: periodFinishMs > 0 ? new Date(periodFinishMs) : undefined,
          earnedAmount: new TokenAmount(uni, JSBI.BigInt(earnedAmountState?.result?.[0] ?? 0)),
          rewardRate: individualRewardRate,
          totalRewardRate: totalRewardRate,
          stakedAmount: stakedAmount,
          totalStakedAmount: totalStakedAmount,
          getHypotheticalRewardRate
        })
      }
      return memo
    }, [])
  }, [balances, chainId, earnedAmounts, info, periodFinishes, rewardRates, rewardsAddresses, totalSupplies, uni])
}

export function useTotalUniEarned(): TokenAmount | undefined {
  const { chainId } = useActiveWeb3React()
  const uni = chainId ? UNI[chainId] : undefined
  const stakingInfos = useStakingInfo()

  return useMemo(() => {
    if (!uni) return undefined
    return (
      stakingInfos?.reduce(
        (accumulator, stakingInfo) => accumulator.add(stakingInfo.earnedAmount),
        new TokenAmount(uni, '0')
      ) ?? new TokenAmount(uni, '0')
    )
  }, [stakingInfos, uni])
}

// based on typed value
export function useDerivedStakeInfo(
  typedValue: string,
  stakingToken: Token,
  userLiquidityUnstaked: TokenAmount | undefined
): {
  parsedAmount?: CurrencyAmount
  error?: string
} {
  const { t } = useTranslation()
  const { account } = useActiveWeb3React()

  const parsedInput: CurrencyAmount | undefined = tryParseAmount(typedValue, stakingToken)

  const parsedAmount =
    parsedInput && userLiquidityUnstaked && JSBI.lessThanOrEqual(parsedInput.raw, userLiquidityUnstaked.raw)
      ? parsedInput
      : undefined

  let error: string | undefined
  if (!account) {
    error = t('Connect Wallet')
  }
  if (!parsedAmount) {
    error = error ?? t('Enter an amount')
  }

  return {
    parsedAmount,
    error
  }
}

// based on typed value
export function useDerivedUnstakeInfo(
  typedValue: string,
  stakingAmount: TokenAmount
): {
  parsedAmount?: CurrencyAmount
  error?: string
} {
  const { t } = useTranslation()
  const { account } = useActiveWeb3React()

  const parsedInput: CurrencyAmount | undefined = tryParseAmount(typedValue, stakingAmount.token)

  const parsedAmount = parsedInput && JSBI.lessThanOrEqual(parsedInput.raw, stakingAmount.raw) ? parsedInput : undefined

  let error: string | undefined
  if (!account) {
    error = t('Connect Wallet')
  }
  if (!parsedAmount) {
    error = error ?? t('Enter an amount')
  }

  return {
    parsedAmount,
    error
  }
}
