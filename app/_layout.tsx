import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import type { Notification, Subscription } from 'expo-notifications';
import { setNotificationHandler } from 'expo-notifications';
import * as Notifications from 'expo-notifications';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Exercise from '../database/models/exercise';
import Plan from '../database/models/plan';
import { schema, schemaMigrations } from '../database/schema';
import DatabaseProvider from '../providers/databaseProvider';
import { registerForPushNotificationsAsync } from '../utils/notifications';

setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldSetBadge: false,
    shouldPlaySound: false,
  }),
});

const adapter = new SQLiteAdapter({
  schema,
  // @ts-ignore
  schemaMigrations,
});

const database = new Database({
  adapter,
  modelClasses: [Plan, Exercise],
});

export default function Root() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notification>();
  const notificationListener = useRef<Subscription>();
  const responseListener = useRef<Subscription>();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
    notificationListener.current = Notifications.addNotificationReceivedListener(n => {
      setNotification(n);
    });
    responseListener.current = Notifications.addNotificationResponseReceivedListener(r => {
      console.log(r);
    });
    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <DatabaseProvider database={database}>
      <SafeAreaView className="flex-1 bg-gray-100">
        <Text className="text-white">Token: {JSON.stringify(expoPushToken)}</Text>
        <Text className="text-white">Notification: {JSON.stringify(notification)}</Text>
        <Slot />
        <StatusBar
          // eslint-disable-next-line react/style-prop-object
          style="dark"
          backgroundColor="rgb(243 244 246)"
        />
      </SafeAreaView>
    </DatabaseProvider>
  );
}

// If adding OTA notifications.
/*
import type { Notification, Subscription } from 'expo-notifications';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { registerForPushNotificationsAsync } from '../utils/notifications';

const [expoPushToken, setExpoPushToken] = useState('');
const [notification, setNotification] = useState<Notification>();
const notificationListener = useRef<Subscription>();
const responseListener = useRef<Subscription>();

useEffect(() => {
  registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
  notificationListener.current = Notifications.addNotificationReceivedListener(n => {
    setNotification(n);
  });
  responseListener.current = Notifications.addNotificationResponseReceivedListener(r => {
    console.log(r);
  });
  return () => {
    Notifications.removeNotificationSubscription(notificationListener.current);
    Notifications.removeNotificationSubscription(responseListener.current);
  };
}, []);
*/
