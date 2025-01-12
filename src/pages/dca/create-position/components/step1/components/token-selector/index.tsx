import { Token } from 'types';
import styled from 'styled-components';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TokenButton from '@pages/dca/create-position/components/token-button';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { emptyTokenWithAddress } from '@common/utils/currency';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useCreatePositionState } from '@state/create-position/hooks';
import useSelectedNetwork from '@hooks/useSelectedNetwork';
import useTrackEvent from '@hooks/useTrackEvent';
import { useAppDispatch } from '@state/hooks';
import { setTo, setFromValue, setFrom } from '@state/create-position/actions';
import useReplaceHistory from '@hooks/useReplaceHistory';

export const StyledTokensContainer = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
`;

export const StyledTokenContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 0;
  gap: 5px;
`;

export const StyledToggleContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
`;

export const StyledToggleTokenButton = styled(IconButton)`
  border: 4px solid #1b1821;
  background-color: #292929;
  :hover {
    background-color: #484848;
  }
`;

type Props = {
  startSelectingCoin: (token: Token) => void;
};

const TokenSelector = ({ startSelectingCoin }: Props) => {
  const { from, to, fromValue } = useCreatePositionState();
  const selectedNetwork = useSelectedNetwork();
  const trackEvent = useTrackEvent();
  const dispatch = useAppDispatch();
  const replaceHistory = useReplaceHistory();

  const toggleFromTo = () => {
    dispatch(setTo(from));

    // check for decimals
    if (to && from && to.decimals < from.decimals) {
      const splitValue = /^(\d*)\.?(\d*)$/.exec(fromValue);
      let newFromValue = fromValue;
      if (splitValue && splitValue[2] !== '') {
        newFromValue = `${splitValue[1]}.${splitValue[2].substring(0, to.decimals)}`;
      }

      dispatch(setFromValue(newFromValue));
    }
    dispatch(setFrom(to));

    if (to) {
      replaceHistory(`/create/${selectedNetwork.chainId}/${to.address || ''}/${from?.address || ''}`);
    }
    trackEvent('DCA - Toggle from/to', { fromAddress: from?.address, toAddress: to?.address });
  };

  return (
    <StyledTokensContainer>
      <StyledTokenContainer>
        <Typography variant="body1">
          <FormattedMessage description="sell" defaultMessage="Sell" />
        </Typography>
        <TokenButton token={from} onClick={() => startSelectingCoin(from || emptyTokenWithAddress('from'))} />
      </StyledTokenContainer>
      <StyledToggleContainer>
        <StyledToggleTokenButton onClick={() => toggleFromTo()}>
          <SwapHorizIcon />
        </StyledToggleTokenButton>
      </StyledToggleContainer>
      <StyledTokenContainer>
        <Typography variant="body1">
          <FormattedMessage description="receive" defaultMessage="Receive" />
        </Typography>
        <TokenButton token={to} onClick={() => startSelectingCoin(to || emptyTokenWithAddress('to'))} />
      </StyledTokenContainer>
    </StyledTokensContainer>
  );
};

export default TokenSelector;
