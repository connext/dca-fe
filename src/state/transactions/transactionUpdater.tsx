import React, { useCallback, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { useSnackbar } from 'notistack';
import omit from 'lodash/omit';
import values from 'lodash/values';
import useBuildTransactionMessage from '@hooks/useBuildTransactionMessage';
import useBuildRejectedTransactionMessage from '@hooks/useBuildRejectedTransactionMessage';
import Zoom from '@mui/material/Zoom';
import { useBlockNumber, useGetBlockNumber } from '@state/block-number/hooks';
import { updateBlockNumber } from '@state/block-number/actions';
import EtherscanLink from '@common/components/view-on-etherscan';
import { TransactionDetails, TransactionReceipt, TransactionTypes } from '@types';
import { setInitialized } from '@state/initializer/actions';
import useTransactionService from '@hooks/useTransactionService';
import useWalletService from '@hooks/useWalletService';
import useSafeService from '@hooks/useSafeService';
import usePositionService from '@hooks/usePositionService';
import { updatePosition } from '@state/position-details/actions';
import useLoadedAsSafeApp from '@hooks/useLoadedAsSafeApp';
import useCurrentNetwork from '@hooks/useCurrentNetwork';
import { usePendingTransactions } from './hooks';
import { checkedTransaction, finalizeTransaction, removeTransaction, transactionFailed } from './actions';
import { useAppDispatch, useAppSelector } from '../hooks';

interface TxInterface {
  addedTime: number;
  receipt?: TransactionReceipt;
  lastCheckedBlockNumber?: number;
}

export function shouldCheck(lastBlockNumber: number, tx: TxInterface): boolean {
  if (tx.receipt) return false;
  if (!tx.lastCheckedBlockNumber) return true;
  const blocksSinceCheck = lastBlockNumber - tx.lastCheckedBlockNumber;
  if (blocksSinceCheck < 1) return false;
  const minutesPending = (new Date().getTime() - tx.addedTime) / 1000 / 60;
  if (minutesPending > 60) {
    // every 10 blocks if pending for longer than an hour
    return blocksSinceCheck > 9;
  }
  if (minutesPending > 5) {
    // every 3 blocks if pending more than 5 minutes
    return blocksSinceCheck > 2;
  }
  // otherwise every block
  return true;
}

export default function Updater(): null {
  const transactionService = useTransactionService();
  const walletService = useWalletService();
  const positionService = usePositionService();
  const loadedAsSafeApp = useLoadedAsSafeApp();
  const safeService = useSafeService();

  const currentNetwork = useCurrentNetwork();

  const lastBlockNumber = useBlockNumber(currentNetwork.chainId);

  const getBlockNumber = useGetBlockNumber();

  const dispatch = useAppDispatch();
  const state = useAppSelector((appState) => appState.transactions);

  const transactions = useMemo(
    () =>
      values(state).reduce<{
        [txHash: string]: TransactionDetails;
      }>((acc, chainState) => ({ ...acc, ...chainState }), {}) || {},
    [state]
  );

  const { enqueueSnackbar } = useSnackbar();

  const buildTransactionMessage = useBuildTransactionMessage();
  const buildRejectedTransactionMessage = useBuildRejectedTransactionMessage();

  const pendingTransactions = usePendingTransactions();

  const getReceipt = useCallback(
    (hash: string, chainId: number) => {
      if (!walletService.getAccount()) throw new Error('No library or chainId');
      return transactionService.getTransactionReceipt(hash, chainId);
    },
    [walletService]
  );
  const checkIfTransactionExists = useCallback(
    (hash: string, chainId: number) => {
      if (!walletService.getAccount()) throw new Error('No library or chainId');
      return transactionService.getTransaction(hash, chainId).then((tx: ethers.providers.TransactionResponse) => {
        const lastBlockNumberForChain = getBlockNumber(chainId);
        if (!tx) {
          const txToCheck = transactions[hash];
          if (txToCheck.retries > 2) {
            positionService.handleTransactionRejection({
              ...txToCheck,
              typeData: {
                ...txToCheck.typeData,
              },
            } as TransactionDetails);
            dispatch(removeTransaction({ hash, chainId: transactions[hash].chainId }));
            enqueueSnackbar(
              buildRejectedTransactionMessage({
                ...txToCheck,
                typeData: {
                  ...txToCheck.typeData,
                },
              } as TransactionDetails),
              {
                variant: 'error',
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'right',
                },
                TransitionComponent: Zoom,
              }
            );
          } else {
            dispatch(
              transactionFailed({ hash, blockNumber: lastBlockNumberForChain, chainId: transactions[hash].chainId })
            );
          }
        } else {
          dispatch(
            checkedTransaction({ hash, blockNumber: lastBlockNumberForChain, chainId: transactions[hash].chainId })
          );
        }

        return true;
      });
    },
    [walletService, walletService.getAccount(), transactions, getBlockNumber, dispatch]
  );

  useEffect(() => {
    pendingTransactions.forEach((transaction) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      positionService.setPendingTransaction(transaction);
    });
    dispatch(setInitialized());
  }, []);

  useEffect(() => {
    if (!walletService.getAccount() || !lastBlockNumber) return;

    Object.keys(transactions)
      .filter((hash) => shouldCheck(getBlockNumber(transactions[hash].chainId) || -1, transactions[hash]))
      .forEach((hash) => {
        const promise = getReceipt(hash, transactions[hash].chainId);
        promise
          .then(async (receipt) => {
            const tx = transactions[hash];
            if (receipt && !tx.receipt && receipt.status !== 0) {
              let extendedTypeData = {};

              if (tx.type === TransactionTypes.newPair) {
                extendedTypeData = {
                  id: ethers.utils.hexValue(receipt.logs[receipt.logs.length - 1].data),
                };
              }

              if (tx.type === TransactionTypes.newPosition) {
                const parsedLog = await transactionService.parseLog(receipt.logs, tx.chainId, 'Deposited');
                extendedTypeData = {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                  id: parsedLog.args.positionId.toString(),
                };
              }

              if (tx.type === TransactionTypes.migratePosition || tx.type === TransactionTypes.migratePositionYield) {
                const parsedLog = await transactionService.parseLog(receipt.logs, tx.chainId, 'Deposited');

                extendedTypeData = {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                  newId: parsedLog.args.positionId.toString(),
                };
              }

              let realSafeHash;
              try {
                if (loadedAsSafeApp) {
                  realSafeHash = await safeService.getHashFromSafeTxHash(hash);
                }
              } catch (e) {
                console.error('Unable to fetch real tx hash from safe hash');
              }

              positionService.handleTransaction({
                ...tx,
                typeData: {
                  ...tx.typeData,
                  ...extendedTypeData,
                },
              } as TransactionDetails);

              dispatch(
                updatePosition({
                  ...tx,
                  typeData: {
                    ...tx.typeData,
                    ...extendedTypeData,
                  },
                } as TransactionDetails)
              );

              dispatch(
                finalizeTransaction({
                  hash,
                  receipt: {
                    ...omit(receipt, ['gasUsed', 'cumulativeGasUsed', 'effectiveGasPrice']),
                    chainId: tx.chainId,
                    gasUsed: (receipt.gasUsed || 0).toString(),
                    cumulativeGasUsed: (receipt.cumulativeGasUsed || 0).toString(),
                    effectiveGasPrice: (receipt.effectiveGasPrice || 0).toString(),
                  },
                  extendedTypeData,
                  chainId: tx.chainId,
                  realSafeHash,
                })
              );

              enqueueSnackbar(
                buildTransactionMessage({
                  ...tx,
                  typeData: {
                    ...tx.typeData,
                    ...extendedTypeData,
                  },
                } as TransactionDetails),
                {
                  variant: 'success',
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'right',
                  },
                  action: () => <EtherscanLink hash={hash} />,
                  TransitionComponent: Zoom,
                }
              );

              // the receipt was fetched before the block, fast forward to that block to trigger balance updates
              if (receipt.blockNumber > lastBlockNumber) {
                dispatch(updateBlockNumber({ blockNumber: receipt.blockNumber, chainId: transactions[hash].chainId }));
              }
            } else if (receipt && !tx.receipt && receipt?.status === 0) {
              if (receipt?.status === 0) {
                positionService.handleTransactionRejection({
                  ...tx,
                  typeData: {
                    ...tx.typeData,
                  },
                } as TransactionDetails);
                dispatch(removeTransaction({ hash, chainId: tx.chainId }));
                enqueueSnackbar(
                  buildRejectedTransactionMessage({
                    ...tx,
                    typeData: {
                      ...tx.typeData,
                    },
                  } as TransactionDetails),
                  {
                    variant: 'error',
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'right',
                    },
                    TransitionComponent: Zoom,
                  }
                );
              } else {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                checkIfTransactionExists(hash, transactions[hash].chainId);
              }
            }

            return true;
          })
          .catch((error) => {
            console.error(`Failed to check transaction hash: ${hash}`, error);
          });
      });
  }, [
    walletService.getAccount(),
    transactions,
    lastBlockNumber,
    dispatch,
    getReceipt,
    checkIfTransactionExists,
    loadedAsSafeApp,
  ]);

  return null;
}
