import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';

/** Legacy route — redirects to BranchDetail hub. */
export function BranchSettingsScreen({
  navigation,
  route,
}: NativeStackScreenProps<MoreStackParamList, 'BranchSettings'>) {
  const id = String(route.params?.id ?? '');

  useEffect(() => {
    navigation.replace('BranchDetail', { id });
  }, [navigation, id]);

  return null;
}
