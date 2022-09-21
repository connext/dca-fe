import React from 'react';
import styled from 'styled-components';
import Modal from 'common/modal';
import isUndefined from 'lodash/isUndefined';
import { Position, YieldOption } from 'types';
import { FormattedMessage } from 'react-intl';
import useTransactionModal from 'hooks/useTransactionModal';
import Typography from '@mui/material/Typography';
import { useTransactionAdder } from 'state/transactions/hooks';
import { PERMISSIONS, TRANSACTION_TYPES } from 'config/constants';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import Grid from '@mui/material/Grid';
import { ButtonTypes } from 'common/button';
import usePositionService from 'hooks/usePositionService';
import useYieldOptions from 'hooks/useYieldOptions';
import YieldTokenSelector from 'common/yield-token-selector';
import { formatCurrencyAmount } from 'utils/currency';

const StyledGrid = styled(Grid)`
  display: flex;
`;

const StyledContent = styled.div`
  background-color: #333333;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const StyledYieldHelpContainer = styled(Typography)`
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
`;

const StyledYieldHelpDescriptionContainer = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: column;
`;

interface MigrateYieldModalProps {
  position: Position;
  onCancel: () => void;
  open: boolean;
}

const MigrateYieldModal = ({ position, open, onCancel }: MigrateYieldModalProps) => {
  const { from, to, toWithdraw, chainId } = position;
  const [fromYield, setFromYield] = React.useState<YieldOption | null | undefined>(undefined);
  const [toYield, setToYield] = React.useState<YieldOption | null | undefined>(undefined);
  const [yieldOptions, isLoadingYieldOptions] = useYieldOptions(chainId);
  const [setModalSuccess, setModalLoading, setModalError] = useTransactionModal();
  const positionService = usePositionService();
  const addTransaction = useTransactionAdder();

  const handleCancel = () => {
    onCancel();
  };

  const handleMigrate = async () => {
    if (!position) {
      return;
    }

    try {
      handleCancel();

      const hasPermission = await positionService.companionHasPermission(position, PERMISSIONS.TERMINATE);

      setModalLoading({
        content: (
          <>
            <Typography variant="body1">
              <FormattedMessage
                description="Migrating your position"
                defaultMessage="Migrating your {from}/{to} position to start earning yield"
                values={{
                  from: position.from,
                  to: position.to,
                }}
              />
            </Typography>
            {!hasPermission && (
              <Typography variant="body1">
                <FormattedMessage
                  description="Approve signature companion text migrate"
                  defaultMessage="You will need to first sign a message (which is costless) to approve our Companion contract. Then, you will need to submit the transaction where you migrate the position."
                />
              </Typography>
            )}
          </>
        ),
      });
      const result = await positionService.migrateYieldPosition(position, fromYield, toYield);
      addTransaction(result, {
        type: TRANSACTION_TYPES.MIGRATE_POSITION,
        typeData: { id: position.id },
        position,
      });
      setModalSuccess({
        hash: result.hash,
        content: (
          <FormattedMessage
            description="success migrating your position"
            defaultMessage="Migrating your {from}/{to} position to earn yield has been succesfully submitted to the blockchain and will be confirmed soon"
          />
        ),
      });
    } catch (e) {
      /* eslint-disable  @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
      setModalError({
        content: 'Error changing rate and swaps',
        error: { code: e.code, message: e.message, data: e.data },
      });
      /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    }
  };

  const actions: {
    label: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    color?: keyof typeof ButtonTypes;
    variant?: 'text' | 'outlined' | 'contained';
  }[] = [
    {
      color: 'secondary',
      variant: 'contained',
      label: (
        <FormattedMessage description="generateYield" defaultMessage="Migrate position and start generating yield" />
      ),
      onClick: handleMigrate,
      disabled: isUndefined(fromYield) || isUndefined(toYield),
    },
  ];

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      showCloseIcon
      maxWidth="sm"
      title={<FormattedMessage description="gainYield title" defaultMessage="Start generating yield" />}
      actions={actions}
    >
      <Grid container alignItems="stretch" spacing={2}>
        <StyledGrid item xs={6}>
          <StyledContent>
            <YieldTokenSelector
              token={from}
              yieldOptions={yieldOptions || []}
              isLoading={isLoadingYieldOptions}
              setYieldOption={setFromYield}
              yieldSelected={fromYield}
              inModal
            />
          </StyledContent>
        </StyledGrid>
        <StyledGrid item xs={6}>
          <StyledContent>
            <YieldTokenSelector
              token={to}
              yieldOptions={yieldOptions || []}
              isLoading={isLoadingYieldOptions}
              setYieldOption={setToYield}
              yieldSelected={toYield}
              inModal
            />
          </StyledContent>
        </StyledGrid>
        <Grid item xs={12}>
          <StyledContent>
            <StyledYieldHelpContainer variant="body1">
              <HelpOutlineOutlinedIcon fontSize="inherit" color="primary" />
              <FormattedMessage description="howItWorks" defaultMessage="How it works" />
            </StyledYieldHelpContainer>
            <StyledYieldHelpDescriptionContainer>
              <Typography variant="body2" color="rgba(255, 255, 255, 0.5);" textAlign="left">
                <FormattedMessage
                  description="howItWorksDescriptionStep1"
                  defaultMessage="We will need to first terminate your position and then open a new one where you will start generating yield. Your historical data from this position will appear as a terminated position"
                />
              </Typography>
              {/* <Typography variant="body2" color="rgba(255, 255, 255, 0.5);" textAlign="left">
                <FormattedMessage
                  description="howItWorksDescriptionStep2"
                  defaultMessage="For this you will need to sign a message (which is costless) where you will approve our Companion to terminate your position and then submit the migration transaction"
                />
              </Typography> */}
              <Typography variant="body2" color="rgba(255, 255, 255, 0.5);" textAlign="left">
                <FormattedMessage
                  description="howItWorksDescriptionStep3"
                  defaultMessage="You will get back {toWithdraw} {to} to your wallet."
                  values={{
                    toWithdraw: formatCurrencyAmount(toWithdraw, to),
                    to: to.symbol,
                  }}
                />
              </Typography>
            </StyledYieldHelpDescriptionContainer>
          </StyledContent>
        </Grid>
      </Grid>
    </Modal>
  );
};
export default MigrateYieldModal;
