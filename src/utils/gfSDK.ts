import { Client } from '@bnb-chain/greenfield-js-sdk';
import { forEach } from '.';
import { DAPP_NAME, GREENFIELD_CHAIN } from '../env';

export const getSingleton = function () {
  let client: Client | null;
  return function () {
    if (!client) {
      client = Client.create(
        GREENFIELD_CHAIN.rpcUrls.default.http[0],
        String(GREENFIELD_CHAIN.id),
      );
    }
    return client;
  };
};

export const getClient = getSingleton();

export const client = getClient();

export const getSps = async () => {
  const sps = await client.sp.getStorageProviders();
  console.log('sps', sps);
  const finalSps = (sps ?? []).filter(
    (v: any) =>
      v?.description?.moniker !== 'QATest' &&
      (v.endpoint.indexOf('bnbchain.org') > 0 ||
        v.endpoint.indexOf('nodereal.io') > 0),
  );

  return finalSps;
};

export const selectSp = async () => {
  const finalSps = await getSps();
  const selectIndex = 0;
  const secondarySpAddresses = [
    ...finalSps.slice(0, selectIndex),
    ...finalSps.slice(selectIndex + 1),
  ].map((item) => item.operatorAddress);
  const selectSpInfo = {
    id: finalSps[selectIndex].id,
    endpoint: finalSps[selectIndex].endpoint,
    primarySpAddress: finalSps[selectIndex]?.operatorAddress,
    sealAddress: finalSps[selectIndex].sealAddress,
    secondarySpAddresses,
  };

  return selectSpInfo;
};

export const getRandomSp = async () => {
  const sps = await client.sp.getStorageProviders();
  const finalSps = (sps ?? []).filter(
    (v: any) =>
      v?.description?.moniker !== 'QATest' &&
      (v.endpoint.indexOf('bnbchain.org') > 0 ||
        v.endpoint.indexOf('nodereal.io') > 0),
  );
  return finalSps[Math.floor(Math.random() * finalSps.length)].endpoint;
};

export const multiTx = async (list: any) => {
  return await client.txClient.multiTx(list);
};

export const getBucketList = async (address: string) => {
  const endpoint = await getRandomSp();
  const bucketList = await client.bucket.listBuckets({
    address,
    endpoint,
  });
  forEach(bucketList.body);
  return bucketList;
};

export const getBucketFileList = async ({ bucketName }: any) => {
  const endpoint = await getRandomSp();
  const fileList = await client.object.listObjects({
    bucketName,
    endpoint,
  });
  if (!fileList.body) return null;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  fileList.body = fileList.body.GfSpListObjectsByBucketNameResponse;
  forEach(fileList.body);
  return fileList;
};

interface MsgCreateGroup {
  /** owner defines the account address of group owner who create the group */
  creator: string;
  /** group_name defines the name of the group. it's not globally unique. */
  groupName: string;
  /** member_request defines a list of member which to be add or remove */
  members: string[];

  extra: string;
}

export const CreateGroup = async (params: MsgCreateGroup) => {
  return await client.group.createGroup(params);
};

export const putObjectPolicy = async (
  bucketName: string,
  ObjectName: string,
  srcMsg: any,
) => {
  return await client.object.putObjectPolicy(bucketName, ObjectName, srcMsg);
};

export const putBucketPolicy = async (bucketName: string, srcMsg: any) => {
  return await client.bucket.putBucketPolicy(bucketName, srcMsg);
};

export type QueryHeadGroupResponse = Awaited<
  ReturnType<typeof getGroupInfoByName>
>;
export const getGroupInfoByName = async (
  groupName: string,
  groupOwner: string,
) => {
  try {
    return await client.group.headGroup(groupName, groupOwner);
  } catch {
    return {} as any;
  }
};

export const checkGroupExistByName = async (
  groupName: string,
  groupOwner: string,
) => {
  const o = await getGroupInfoByName(groupName, groupOwner);
  return Object.keys(o).length;
};

export const checkGroupExistById = async (tokenId: string) => {
  const o = await headGroupNFT(tokenId);
  return Object.keys(o).length;
};

export const checkAddressInGroup = async (
  groupName: string,
  groupOwner: string,
  member: string,
) => {
  try {
    return await client.group.headGroupMember(groupName, groupOwner, member);
  } catch (e) {
    return false;
  }
};

export const headGroupNFT = async (tokenId: string) => {
  try {
    return await client.group.headGroupNFT({ tokenId });
  } catch (e) {
    return {};
  }
};

export type QueryHeadObjectResponse = Awaited<
  ReturnType<typeof getObjectInfoByName>
>;
export const getObjectInfo = async (objectId: string) => {
  return await client.object.headObjectById(objectId);
};
export const getObjectInfoByName = async (
  bucketName: string,
  objectName: string,
) => {
  return await client.object.headObject(bucketName, objectName);
};

export const getObjectInfoById = async (objectId: string) => {
  return await client.object.headObjectById(objectId);
};

export const updateGroupInfo = async (
  address: string,
  groupName: string,
  extra: string,
) => {
  return await client.group.updateGroupExtra({
    operator: address,
    groupOwner: address,
    groupName,
    extra,
  });
};

export const updateGroupInfoWithTx = async (
  address: string,
  groupName: string,
  extra: string,
) => {
  const tx = await client.group.updateGroupExtra({
    groupName,
    extra,
    groupOwner: address,
    operator: address,
  });

  const simulateInfo = await tx.simulate({
    denom: 'BNB',
  });

  return await tx.broadcast({
    denom: 'BNB',
    gasLimit: Number(simulateInfo?.gasLimit),
    gasPrice: simulateInfo?.gasPrice || '5000000000',
    payer: address,
    granter: '',
  });
};

export const getCollectionInfo = async (bucketId: string) => {
  return await client.bucket.headBucketById(bucketId);
};

export type QueryHeadBucketResponse = Awaited<
  ReturnType<typeof getCollectionInfoByName>
>;

export const getCollectionInfoByName = async (bucketName: string) => {
  return await client.bucket.headBucket(bucketName);
};

export const searchKey = async (key: string) => {
  try {
    const res = await client.sp.listGroups({
      name: key,
      prefix: `${DAPP_NAME}_`,
      sourceType: 'SOURCE_TYPE_ORIGIN',
      limit: 1000,
      offset: 0,
    });
    const groups = res?.body?.GfSpGetGroupListResponse?.Groups || [];
    forEach(groups);
    return { groups };
  } catch (e) {
    return [];
  }
};
