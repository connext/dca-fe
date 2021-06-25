import type Web3Service from 'services/web3Service';
import React from 'react';
import { BigNumber } from 'ethers';

type SetStateCallback<T> = React.Dispatch<React.SetStateAction<T>>;

type Token = {
  chainId: number;
  decimals: number;
  address: string;
  name: string;
  symbol: string;
  logoURI: string;
};

type TokenList = Record<string, Token>;

type AvailablePair = {
  token0: string;
  token1: string;
  id: string;
};

type AvailablePairs = AvailablePair[];

type Web3ServicePromisableMethods =
  | 'connect'
  | 'disconnect'
  | 'setUpModal'
  | 'getBalance'
  | 'getEstimatedPairCreation'
  | 'getCurrentPositions'
  | 'getNetwork'
  | 'getUsedTokens';

interface CurrentPosition {
  from: string;
  to: string;
  remainingDays: number;
  startedAt: Date;
  exercised: BigNumber;
  remainingLiquidity: BigNumber;
}

interface Network {
  chainId: number;
}

type CurrentPositions = CurrentPosition[];

interface GasNowResponseData {
  rapid: number;
  fast: number;
  standard: number;
  slow: number;
  timestamp: number;
}

interface GasNowResponse {
  code: number;
  data: GasNowResponseData;
}

interface CoinGeckoTokenPriceResponse {
  id: string;
  current_price: number;
}

type CoinGeckoPriceResponse = CoinGeckoTokenPriceResponse[];

interface UsedTokenInfo {
  address: string;
}

interface UsedToken {
  tokenInfo: UsedTokenInfo;
}

interface GetUsedTokensData {
  tokens: UsedToken[];
}

interface GetUsedTokensDataResponse {
  data: GetUsedTokensData;
}

interface EstimatedPairResponse {
  gas: string;
  gasUsd: number;
}

export {
  Web3Service,
  SetStateCallback,
  Token,
  TokenList,
  AvailablePair,
  AvailablePairs,
  Web3ServicePromisableMethods,
  CurrentPosition,
  CurrentPositions,
  GasNowResponse,
  CoinGeckoPriceResponse,
  Network,
  GetUsedTokensDataResponse,
  EstimatedPairResponse,
};
