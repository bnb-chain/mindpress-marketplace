import styled from '@emotion/styled';
import { Box, Button, Flex } from '@totejs/uikit';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DCELLAR_URL } from '../../env';
import { NavBar } from '../NavBar';
import MyCollectionList from './MyCollectionList';
import OtherListedList from './OtherListedList';
import PurchaseList from './PurchaseList';

enum Type {
  Collections = 'uploaded',
  Purchase = 'purchased',
}
const _navItems = [
  {
    name: 'My Uploaded',
    key: Type.Collections,
  },
  {
    name: 'My Purchases',
    key: Type.Purchase,
  },
];

interface IProfileList {
  realAddress: string;
  self: boolean;
}
const ProfileList = (props: IProfileList) => {
  const [p] = useSearchParams();
  const tab = p.getAll('tab')[0];

  const navigator = useNavigate();
  const { realAddress, self } = props;

  const [navItems, setNavItems] = useState(_navItems);

  useEffect(() => {
    if (!self) {
      const cp = JSON.parse(JSON.stringify(_navItems));
      cp.splice(1, 1);
      cp[0].name = 'Data List';
      setNavItems(cp);
    } else {
      setNavItems(_navItems);
    }
  }, [realAddress, self]);

  const currentTab = tab ? tab : Type.Collections;
  const handleTabChange = useCallback(
    (tab: any) => {
      navigator(`/profile?tab=${tab}`);
    },
    [navigator],
  );

  const [showButton, setShowButton] = useState(false);

  return (
    <Container>
      <NavCon alignItems={'center'}>
        <NavBar
          active={currentTab}
          onChange={handleTabChange}
          items={navItems}
        />
        {self && showButton && (
          <MyButton
            onClick={() => {
              window.open(`${DCELLAR_URL}`);
            }}
            size={'sm'}
            style={{ marginLeft: '6px' }}
            bg="#FFE900"
            color="#181A1E"
            fontWeight="800"
            _hover={{
              bg: '#EBD600',
              color: '#181A1E',
            }}
          >
            Upload Data in DCellar
          </MyButton>
        )}
      </NavCon>

      <Box h={20} />
      {self ? (
        currentTab === Type.Collections ? (
          <MyCollectionList setShowButton={setShowButton}></MyCollectionList>
        ) : (
          <PurchaseList></PurchaseList>
        )
      ) : (
        <OtherListedList
          realAddress={realAddress}
          self={self}
        ></OtherListedList>
      )}
    </Container>
  );
};

export default ProfileList;

const Container = styled.div`
  margin-top: 30px;
  margin-left: auto;
  margin-right: auto;
  width: 1200px;
`;

const NavCon = styled(Flex)``;
const MyButton = styled(Button)`
  width: 200px;
  height: 40px;
  border-radius: 8px;
`;
