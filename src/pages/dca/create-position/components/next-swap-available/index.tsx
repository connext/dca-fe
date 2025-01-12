import styled from 'styled-components';
import React from 'react';
import findIndex from 'lodash/findIndex';
import isUndefined from 'lodash/isUndefined';
import { DateTime } from 'luxon';
import { FormattedMessage } from 'react-intl';
import Typography from '@mui/material/Typography';
import { useCreatePositionState } from '@state/create-position/hooks';
import { AvailablePair } from '@types';
import { SWAP_INTERVALS_MAP } from '@constants';

const StyledNextSwapContainer = styled.div`
  display: flex;
  margin-top: 5px;
`;

type Props = {
  existingPair?: AvailablePair;
  yieldEnabled: boolean;
};

const NextSwapAvailable = ({ existingPair, yieldEnabled }: Props) => {
  const { fromYield, frequencyType, toYield } = useCreatePositionState();

  const freqIndex = findIndex(SWAP_INTERVALS_MAP, { value: frequencyType });

  const nextSwapAvailableAt = existingPair?.nextSwapAvailableAt[freqIndex];

  const showNextSwapAvailableAt = !yieldEnabled || (yieldEnabled && !isUndefined(fromYield) && !isUndefined(toYield));

  return (
    <>
      {showNextSwapAvailableAt && !!nextSwapAvailableAt && (
        <StyledNextSwapContainer>
          <Typography variant="caption" color="rgba(255, 255, 255, 0.5)">
            <FormattedMessage
              description="nextSwapCreate"
              defaultMessage="Next swap for this position will be executed "
            />
            {DateTime.fromSeconds(nextSwapAvailableAt) > DateTime.now() && (
              <FormattedMessage
                description="nextSwapCreateTime"
                defaultMessage="&nbsp;approximately {nextSwapAvailableAt}."
                values={{
                  nextSwapAvailableAt: DateTime.fromSeconds(nextSwapAvailableAt).toRelative() || '',
                }}
              />
            )}
            {DateTime.fromSeconds(nextSwapAvailableAt) < DateTime.now() && (
              <FormattedMessage
                description="nextSwapCreateSoon"
                defaultMessage="&nbsp;soon. Create a position now to be included in the next swap."
              />
            )}
          </Typography>
        </StyledNextSwapContainer>
      )}
      {showNextSwapAvailableAt && !nextSwapAvailableAt && !existingPair && (
        <StyledNextSwapContainer>
          <Typography variant="caption" color="rgba(255, 255, 255, 0.5)">
            <FormattedMessage
              description="nextSwapCreateNoPair"
              defaultMessage="Next swap will be executed within the first hour after the position is created."
            />
          </Typography>
        </StyledNextSwapContainer>
      )}
      {showNextSwapAvailableAt && !nextSwapAvailableAt && !!existingPair && (
        <StyledNextSwapContainer>
          <Typography variant="caption" color="rgba(255, 255, 255, 0.5)">
            <FormattedMessage
              description="nextSwapCreateNoPositions"
              defaultMessage="Next swap will be executed within the first hour after the position is created."
            />
          </Typography>
        </StyledNextSwapContainer>
      )}
    </>
  );
};

export default NextSwapAvailable;
