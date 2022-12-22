import React from 'react';
import useWalletService from './useWalletService';
import useWeb3Service from './useWeb3Service';

function useLoadedAsSafeApp() {
  const walletService = useWalletService();
  const account = walletService.getAccount();
  const web3Service = useWeb3Service();

  const loadedAsSafeApp: boolean = React.useMemo(() => web3Service.getLoadedAsSafeApp(), [account]);

  return loadedAsSafeApp;
}

export default useLoadedAsSafeApp;
