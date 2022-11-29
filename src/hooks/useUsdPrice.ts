import React from 'react';
import { Token } from 'types';
import { BigNumber } from 'ethers';
import { parseUsdPrice } from 'utils/currency';
import useRawUsdPrice from './useUsdRawPrice';

function useUsdPrice(
  from: Token | undefined | null,
  amount: BigNumber | null,
  date?: string,
  chainId?: number
): [number | undefined, boolean, string?] {
  const [result, isLoading, error] = useRawUsdPrice(from, date, chainId);

  return React.useMemo(
    () => [parseUsdPrice(from, amount, result), isLoading, error],
    [result, from, amount, isLoading, error]
  );
}

export default useUsdPrice;
