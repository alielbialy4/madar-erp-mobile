import { useEffect } from 'react';
import { useBranchStore } from '@/store/branchStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';

/** Legacy route — redirects to BranchKitchenRouting or BranchDetail. */
export function KitchenRoutingScreen({
  navigation,
  route,
}: NativeStackScreenProps<MoreStackParamList, 'KitchenRouting'>) {
  const branchId = route.params?.branchId ?? useBranchStore.getState().activeBranch?.id;

  useEffect(() => {
    if (branchId) {
      navigation.replace('BranchKitchenRouting', { branchId });
    } else {
      navigation.replace('BranchesList');
    }
  }, [navigation, branchId]);

  return null;
}
