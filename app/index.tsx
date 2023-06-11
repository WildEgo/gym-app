import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { cnb } from 'cnbuilder';
// import { getDocumentAsync } from 'expo-document-picker';
import { Link } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffectOnce } from 'usehooks-ts';
import type ExerciseModel from '../database/models/exercise';
import type PlanModel from '../database/models/plan';
import fakeData from '../fakeData';
import useDatabase from '../hooks/useDatabase';
import type { Exercise } from '../types';

const HomeLoader = () => {
  const progress = useSharedValue(0);

  const style = useAnimatedStyle(() => {
    return {
      opacity: interpolate(progress.value, [0, 1], [0.5, 0.9]),
    };
  }, []);

  useEffectOnce(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
  });

  return (
    <Animated.View style={[style]} className="px-6 pt-6">
      {Array.from(Array(8).keys()).map(idx => (
        <Animated.View className="mb-3.5 h-[90px] rounded-2xl bg-white" key={`homeLoader.${idx}`} />
      ))}
    </Animated.View>
  );
};

export default function HomePage() {
  const db = useDatabase();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    setLoading(true);

    const newPlans = await db.write(async () =>
      db.collections.get<PlanModel>('plans').query().fetch(),
    );

    setPlans(newPlans);
    setLoading(false);
  }, [db]);

  useEffectOnce(() => {
    fetchPlans();
  });

  const importPlans = useCallback(async () => {
    await db.write(async () => {
      const planCollection = db.collections.get<PlanModel>('plans');
      const exerciseCollection = db.collections.get<ExerciseModel>('exercises');
      const exercises: (Exercise & { planId: string })[][] = [];

      await Promise.all(
        fakeData.map(async ({ name, description, exercises: curExercises }) => {
          const plan = await planCollection.create(newPlan => {
            /* eslint-disable no-param-reassign */
            newPlan.name = name;
            newPlan.description = description;
            /* eslint-enable no-param-reassign */
          });

          exercises.push(curExercises.map(e => ({ ...e, planId: plan.id })));
        }),
      );

      exercises.flat().map(async exercise => {
        await exerciseCollection.create(newExercise => {
          /* eslint-disable no-param-reassign */
          newExercise.name = exercise.name;
          newExercise.description = exercise.description;
          newExercise.restTime = Number(exercise.restTime) || 0;
          newExercise.notes = exercise.notes;
          newExercise.planId = exercise.planId;
          /* eslint-enable no-param-reassign */
        });
      });
    }, 'import data');

    fetchPlans();

    /*
    const result = await getDocumentAsync({});

    if (result.type === 'success') {
      console.log(result);
    }
    */
  }, [db, fetchPlans]);

  return (
    <View className="flex-1 bg-gray-100 p-6 pb-1.5">
      <View className="mb-6 flex flex-row items-center justify-between gap-6">
        <View>
          <Text className="text-4xl font-bold text-black">Home</Text>
          <Text className="text-sm">Here&apos;s all your plans</Text>
        </View>
        <View className="flex flex-row items-center gap-1.5">
          <Pressable
            className={cnb(
              'h-8 w-8 items-center justify-center rounded-full bg-gray-50',
              loading && 'opacity-50',
            )}
            disabled={loading}
          >
            <Text className="text-gray-600">
              <Ionicons name="ios-cloud-download-outline" size={20} />
            </Text>
          </Pressable>
          <Pressable
            className={cnb(
              'h-8 w-8 items-center justify-center rounded-full bg-gray-50',
              loading && 'opacity-50',
            )}
            onPress={importPlans}
            disabled={loading}
          >
            <Text className="text-gray-600">
              <Ionicons name="ios-cloud-upload-outline" size={20} />
            </Text>
          </Pressable>
        </View>
      </View>
      <View className="relative flex-1 shrink overflow-hidden">
        {loading ? (
          <HomeLoader />
        ) : (
          <FlashList
            data={plans}
            estimatedItemSize={100}
            ListEmptyComponent={
              <View className="mb-3.5 rounded-2xl bg-white p-6 shadow-xl">
                <Text className="mb-1.5 text-xl font-semibold">Welcome!</Text>
                <Text className="text-base text-black">
                  It seems you have no plans yet, click the button below to add some
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <Link href={`/plans/${item.id}`} asChild>
                <Pressable className="mb-3.5 rounded-2xl bg-white p-6 shadow-xl">
                  <Text className="w-full text-2xl font-semibold">{item.name}</Text>
                  <Text numberOfLines={1} className="w-full text-sm text-black/75">
                    {item.description}
                  </Text>
                </Pressable>
              </Link>
            )}
          />
        )}
      </View>
      <Link href="/plans/new" style={{ width: '100%' }} asChild>
        <Pressable className="mt-3 flex w-full flex-row items-center justify-start rounded-xl bg-fuchsia-200 px-5 py-3">
          <Ionicons name="ios-add" size={24} color="#000000" />
          <Text className="ml-2 text-base font-bold uppercase text-black">Create new plan</Text>
        </Pressable>
      </Link>
    </View>
  );
}
