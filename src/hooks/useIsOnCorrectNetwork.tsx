import React from 'react';
import isEqual from 'lodash/isEqual';
import useCurrentNetwork from './useCurrentNetwork';
import usePrevious from './usePrevious';
import useWalletService from './useWalletService';

function useIsOnCorrectNetwork() {
  const [isLoading, setIsLoading] = React.useState(false);
  const walletService = useWalletService();
  const [result, setResult] = React.useState<boolean | undefined>(undefined);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const currentNetwork = useCurrentNetwork();
  const account = usePrevious(walletService.getAccount());
  const currentAccount = walletService.getAccount();

  React.useEffect(() => {
    async function callPromise() {
      try {
        const promiseResult = await walletService.getNetwork(true);
        const isSameNetwork = currentNetwork.chainId === promiseResult.chainId;
        setResult(isSameNetwork);
        setError(undefined);
      } catch (e) {
        setError(e);
      }
      setIsLoading(false);
    }

    if ((!isLoading && result === undefined && !error) || !isEqual(account, currentAccount)) {
      setIsLoading(true);
      setResult(undefined);
      setError(undefined);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      callPromise();
    }
  }, [isLoading, result, error, currentAccount, account, currentNetwork]);

  return [result, isLoading, error];
}

export default useIsOnCorrectNetwork;