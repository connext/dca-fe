/* eslint-disable max-classes-per-file */
import { BigNumber } from 'ethers';
import { Contract } from '@ethersproject/contracts';
import { TransactionResponse } from '@ethersproject/providers';
import { PairIndex } from 'utils/swap';

export class ERC20Contract extends Contract {
  balanceOf: (address: string) => Promise<BigNumber>;

  deposit: (toDeposit: { value: string }) => Promise<TransactionResponse>;

  allowance: (address: string, contract: string) => Promise<string>;

  approve: (address: string, value: BigNumber) => Promise<TransactionResponse>;
}

interface SwapInfoPairData {
  intervalsInSwap: string;
  ratioAToB: BigNumber;
  ratioBToA: BigNumber;
  tokenA: string;
  tokenB: string;
}

interface SwapInforTokenData {
  platformFee: BigNumber;
  reward: BigNumber;
  toProvide: BigNumber;
  token: string;
}

export class OracleContract extends Contract {
  canSupportPair: (tokenA: string, tokenB: string) => Promise<boolean>;
}

export class HubContract extends Contract {
  getNextSwapInfo: (
    tokens: string[],
    pairIndexes: PairIndex[]
  ) => Promise<{ pairs: SwapInfoPairData[]; tokens: SwapInforTokenData[] }>;

  createPair: (tokenA: string, tokenB: string) => Promise<TransactionResponse>;

  deposit: (
    from: string,
    to: string,
    totalAmmount: BigNumber,
    swaps: BigNumber,
    interval: BigNumber,
    account: string,
    permissions: { operator: string; permissions: string[] }[]
  ) => Promise<TransactionResponse>;

  tokenURI: (id: string) => Promise<string>;

  withdrawSwapped: (id: string, recipient: string) => Promise<TransactionResponse>;

  terminate: (id: string, recipientUnswapped: string, recipientSwapped: string) => Promise<TransactionResponse>;

  increasePosition: (id: string, newAmount: BigNumber, newSwaps: BigNumber) => Promise<TransactionResponse>;

  reducePosition: (
    id: string,
    newAmount: BigNumber,
    newSwaps: BigNumber,
    recipient: string
  ) => Promise<TransactionResponse>;
}
/* eslint-enable */