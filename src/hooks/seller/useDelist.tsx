import NiceModal from '@ebay/nice-modal-react';
import { Box, ModalBody, ModalHeader, Stack, VStack } from '@totejs/uikit';
import { useImmerAtom } from 'jotai-immer';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { delistAtom } from '../../atoms/delistAtom';
import { MarketplaceAbi } from '../../base/contract/marketplace.abi';
import { CustomSuccessIcon } from '../../components/modal/ActionResult';
import { Tips } from '../../components/modal/Tips';
import { BSC_CHAIN, NEW_MARKETPLACE_CONTRACT_ADDRESS } from '../../env';

interface Params {
  onSuccess?: (objectId: bigint) => Promise<void>;
}

export const useDelist = () => {
  // const { onSuccess } = params;
  // console.log('init onSuccess', onSuccess);
  const [delistInfo, setDelistInfo] = useImmerAtom(delistAtom);
  const { address } = useAccount();
  const publicClient = usePublicClient({
    chainId: BSC_CHAIN.id,
  });
  const { data: walletClient } = useWalletClient();

  const doDelist = async ({
    groupId,
    onSuccess,
  }: {
    groupId: bigint;
    onSuccess?: (objectId: bigint) => Promise<void>;
  }) => {
    setDelistInfo((draft) => {
      draft.starting = true;
    });

    try {
      const { request } = await publicClient.simulateContract({
        account: address,
        abi: MarketplaceAbi,
        address: NEW_MARKETPLACE_CONTRACT_ADDRESS,
        functionName: 'delist',
        args: [groupId],
      });

      const hash = await walletClient?.writeContract(request);

      if (hash) {
        await publicClient.waitForTransactionReceipt({
          hash,
        });
      }

      await succDelist();
      await onSuccess?.(delistInfo.params.objectId);
    } catch (err) {
      console.log('err', err);
    } finally {
      setDelistInfo((draft) => {
        draft.starting = false;
        draft.openDelist = false;
      });
    }
  };

  const confirmDelist = (groupId: bigint, objectId: bigint) => {
    setDelistInfo((draft) => {
      draft.openDelist = true;
      draft.params.groupId = groupId;
      draft.params.objectId = objectId;
    });
  };

  const succDelist = async () => {
    NiceModal.show(Tips, {
      title: ``,
      content: (
        <Stack>
          <VStack>
            <CustomSuccessIcon />
            <ModalHeader color="#181A1E" fontSize="24px" fontWeight="800">
              Delist successfully!
            </ModalHeader>
          </VStack>
          <ModalBody>
            <Box color="#5C5F6A" fontSize="16px" textAlign="center" mb="24px">
              You‘ve delisted successfully!
            </Box>
          </ModalBody>
        </Stack>
      ),
      buttonText: 'Got it',
      buttonClick: async () => {
        // ...
      },
    });
  };

  return {
    doDelist,
    confirmDelist,
  };
};
