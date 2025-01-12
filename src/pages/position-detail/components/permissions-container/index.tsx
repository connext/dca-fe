import React from 'react';
import styled from 'styled-components';
import Grid from '@mui/material/Grid';
import { FullPosition, TransactionTypes } from '@types';
import useTransactionModal from '@hooks/useTransactionModal';
import { useTransactionAdder } from '@state/transactions/hooks';
import {
  useHasModifiedPermissions,
  useModifiedPermissions,
  usePositionPermissions,
} from '@state/position-permissions/hooks';
import Typography from '@mui/material/Typography';
import { FormattedMessage } from 'react-intl';
import { discardChanges, submitPermissionChanges } from '@state/position-permissions/actions';
import { useAppDispatch } from '@state/hooks';
import Paper from '@mui/material/Paper';
import usePositionService from '@hooks/usePositionService';
import { fullPositionToMappedPosition } from '@common/utils/parsing';
import useAccount from '@hooks/useAccount';
import useErrorService from '@hooks/useErrorService';
import { shouldTrackError } from '@common/utils/errors';
import PositionPermissionsControls from './components/position-permissions-controls ';
import PositionPermission from './components/permission';
import AddAddressPermissionModal from './components/add-address-permission-modal';

const StyledControlsWrapper = styled(Grid)<{ isPending: boolean }>`
  display: flex;
  justify-content: ${(props) => (props.isPending ? 'flex-end' : 'space-between')};
`;

const StyledFlexGridItem = styled(Grid)`
  display: flex;
`;

const StyledPaper = styled(Paper)`
  padding: 16px;
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  flex-grow: 1;
  background-color: rgba(216, 216, 216, 0.05);
  backdrop-filter: blur(6px);
`;

interface PositionPermissionsContainerProps {
  position: FullPosition;
  pendingTransaction: string | null;
  disabled: boolean;
}

const PositionPermissionsContainer = ({
  position,
  pendingTransaction,
  disabled,
}: PositionPermissionsContainerProps) => {
  const permissions = usePositionPermissions(position.id);
  const hasModifiedPermissions = useHasModifiedPermissions();
  const modifiedPermissions = useModifiedPermissions();
  const positionService = usePositionService();
  const account = useAccount();
  const [shouldShowAddAddressModal, setShouldShowAddAddressModal] = React.useState(false);
  const dispatch = useAppDispatch();
  const errorService = useErrorService();
  const [setModalSuccess, setModalLoading, setModalError] = useTransactionModal();
  const addTransaction = useTransactionAdder();

  const onSave = async () => {
    if (!position) {
      return;
    }

    try {
      setModalLoading({
        content: (
          <Typography variant="body1">
            <FormattedMessage
              description="Modifying your position permissions"
              defaultMessage="Setting your {from}/{to} position permissions"
              values={{
                from: position.from.symbol,
                to: position.to.symbol,
              }}
            />
          </Typography>
        ),
      });
      const result = await positionService.modifyPermissions(
        fullPositionToMappedPosition(position),
        modifiedPermissions
      );
      addTransaction(result, {
        type: TransactionTypes.modifyPermissions,
        typeData: { id: position.id, from: position.from.symbol, to: position.to.symbol },
        position: fullPositionToMappedPosition(position),
      });
      setModalSuccess({
        hash: result.hash,
        content: (
          <FormattedMessage
            description="success modify permission for position"
            defaultMessage="Setting your {from}/{to} position permissions has been succesfully submitted to the blockchain and will be confirmed soon"
            values={{
              from: position.from.symbol,
              to: position.to.symbol,
            }}
          />
        ),
      });
      dispatch(submitPermissionChanges());
    } catch (e) {
      // User rejecting transaction
      // eslint-disable-next-line no-void, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      if (shouldTrackError(e)) {
        // eslint-disable-next-line no-void, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        void errorService.logError('Error setting permissions', JSON.stringify(e), {
          position: position.id,
          permissions,
          chainId: position.chainId,
        });
      }
      /* eslint-disable  @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
      setModalError({
        content: <FormattedMessage description="modalErrorPermissions" defaultMessage="Error setting permissions" />,
        error: { code: e.code, message: e.message, data: e.data },
      });
      /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    }
  };

  const onDiscardChanges = () => {
    dispatch(discardChanges());
  };

  const shouldDisable =
    position.status === 'TERMINATED' ||
    !account ||
    account.toLowerCase() !== position.user.toLowerCase() ||
    !!pendingTransaction;

  return (
    <>
      <AddAddressPermissionModal
        open={shouldShowAddAddressModal}
        onCancel={() => setShouldShowAddAddressModal(false)}
      />
      <Grid container spacing={2} alignItems="stretch">
        <Grid item xs={12}>
          <Typography variant="h5">
            <FormattedMessage description="AddressessPermissions" defaultMessage="Permissions on your position:" />
          </Typography>
          <Typography variant="body1">
            <FormattedMessage
              description="AddressessPermissions"
              defaultMessage="This is where you will find the full list of addresses that have permissions over your position. You also are able to add new addresses or modify the permission for the existing ones"
            />
          </Typography>
        </Grid>
        <StyledControlsWrapper item xs={12} isPending={!!pendingTransaction}>
          {position.status !== 'TERMINATED' && (
            <PositionPermissionsControls
              position={position}
              pendingTransaction={pendingTransaction}
              shouldDisable={!hasModifiedPermissions}
              onSave={onSave}
              onDiscardChanges={onDiscardChanges}
              onAddAddress={() => setShouldShowAddAddressModal(true)}
              disabled={disabled}
            />
          )}
        </StyledControlsWrapper>
        {!!Object.values(permissions).length && (
          <StyledFlexGridItem item xs={12}>
            <StyledPaper variant="outlined">
              <Grid container spacing={2}>
                {Object.values(permissions).map((permission) => (
                  <Grid item xs={12} md={4}>
                    <PositionPermission
                      positionPermission={permission}
                      shouldDisable={shouldDisable}
                      chainId={position.chainId}
                    />
                  </Grid>
                ))}
              </Grid>
            </StyledPaper>
          </StyledFlexGridItem>
        )}
      </Grid>
    </>
  );
};

export default PositionPermissionsContainer;
