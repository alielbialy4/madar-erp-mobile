import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';

/** Returns goBack when the active navigator can pop; otherwise undefined (e.g. stack root). */
export function useOptionalGoBack(): (() => void) | undefined {
  const navigation = useNavigation();

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  return navigation.canGoBack() ? goBack : undefined;
}
