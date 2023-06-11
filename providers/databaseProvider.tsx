import type { Database } from '@nozbe/watermelondb';
import type { ReactNode } from 'react';
import { createContext, useState } from 'react';
import { Text, View } from 'react-native';
import { useEffectOnce } from 'usehooks-ts';

export const DatabaseContext = createContext<{
  database: Database;
}>({
  database: undefined,
});

export default function DatabaseProvider({
  database,
  children,
}: {
  database: Database;
  children: ReactNode;
}) {
  const [loading, setLoading] = useState(true);

  useEffectOnce(() => {
    (async () => {
      await database.write(async () => {
        setLoading(false);
      }, 'checkAvailability');
    })();
  });

  return (
    <DatabaseContext.Provider
      // eslint-disable-next-line react/jsx-no-constructed-context-values
      value={{ database }}
    >
      {loading ? (
        <View className="flex-1 items-center justify-center bg-gray-100">
          <Text>Loading</Text>
        </View>
      ) : (
        children
      )}
    </DatabaseContext.Provider>
  );
}
