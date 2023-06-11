import { Ionicons } from '@expo/vector-icons';
import { Q } from '@nozbe/watermelondb';
import { FlashList } from '@shopify/flash-list';
import { cnb } from 'cnbuilder';
import { LinearGradient } from 'expo-linear-gradient';
import { AndroidNotificationPriority, scheduleNotificationAsync } from 'expo-notifications';
import { useSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffectOnce } from 'usehooks-ts';
import type ExerciseModel from '../../database/models/exercise';
import type PlanModel from '../../database/models/plan';
import useDatabase from '../../hooks/useDatabase';

const PlanLoader = () => {
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
    <Animated.View style={[style]} className="flex-1 px-6 pt-6">
      <View className="mt-0.5 mb-2 h-6 w-1/2 rounded-xl bg-white" />
      <View className="mb-6 h-4 w-12 rounded-xl bg-white" />
      {Array.from(Array(8).keys()).map(idx => (
        <Animated.View className="mb-3.5 h-[90px] rounded-2xl bg-white" key={`homeLoader.${idx}`} />
      ))}
    </Animated.View>
  );
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const DetailedExerciseModal = ({
  exercise,
  onDismiss,
}: {
  exercise: ExerciseModel;
  onDismiss: () => void;
}) => {
  return (
    <Modal visible={!!exercise} transparent animationType="fade" onRequestClose={onDismiss}>
      <View className="absolute inset-0 z-10 bg-gray-100/40 pt-6">
        <View className="flex-1 rounded-t-3xl bg-white pt-2 shadow-2xl">
          <View className="mx-auto mb-6 h-1 w-1/4 shrink-0 rounded-xl bg-gray-200" />
          {!!exercise && (
            <>
              <View className="mb-6 flex shrink-0 flex-row items-center justify-between gap-3 px-6">
                <Pressable
                  className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
                  onPress={onDismiss}
                >
                  <Text className="text-gray-500">
                    <Ionicons name="ios-chevron-back" size={20} />
                  </Text>
                </Pressable>
                <Text className="text-2xl font-bold text-black" numberOfLines={1}>
                  {exercise.name}
                </Text>
                <View className="h-8 w-8" />
              </View>
              <View className="px-6">
                <View className="mb-1.5">
                  <Text className="text-sm font-semibold text-gray-600">Description</Text>
                  <Text className="text-base">{exercise.description}</Text>
                </View>
                <View className="mb-1.5">
                  <Text className="text-sm font-semibold text-gray-600">Notes</Text>
                  <Text className="text-base">{exercise.notes}</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const Exercise = ({
  id,
  name,
  description,
  restTime,
  expand,
}: {
  id: string;
  name: string;
  description: string;
  restTime: number;
  expand: () => void;
}) => {
  const timing = useSharedValue(0);
  const [isCounting, setIsCounting] = useState(false);

  const scale = useSharedValue(1);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${timing.value}%`,
    };
  });

  const finish = useCallback(() => {
    setIsCounting(false);
    timing.value = 0;
  }, [timing]);

  const startCountdown = useCallback(() => {
    scheduleNotificationAsync({
      content: {
        title: 'Rest time completed',
        body: `The rest time for "${name}" has finished, you can continue now.`,
        data: {
          plan: id,
        },
        priority: AndroidNotificationPriority.MAX,
        sticky: true,
      },
      trigger: {
        seconds: restTime,
      },
    });

    setIsCounting(true);
    timing.value = withTiming(
      100,
      {
        duration: restTime * 1000,
        easing: Easing.linear,
      },
      f => f && runOnJS(finish)(),
    );
  }, [finish, id, name, restTime, timing]);

  const longPressGesture = Gesture.LongPress()
    .onStart(e => {
      if (e.state === 4) {
        runOnJS(expand)();
      }
      scale.value = withTiming(0.9);
    })
    .onFinalize(() => {
      scale.value = 1;
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View className="mb-3.5 px-6">
      <GestureDetector gesture={longPressGesture}>
        <Animated.View className="rounded-2xl bg-white p-6 pb-2 shadow-xl" style={containerStyle}>
          <View
            className={cnb(
              'flex flex-row items-center justify-between gap-6',
              restTime ? 'mb-4' : 'mb-5',
            )}
          >
            <View>
              <Text className="w-full text-2xl font-semibold">{name}</Text>
              <Text numberOfLines={1} className="w-full text-sm text-black/75">
                {description}
              </Text>
            </View>
            {!!restTime && (
              <Pressable
                onPress={startCountdown}
                disabled={isCounting}
                className={cnb(isCounting && 'opacity-50')}
              >
                <Ionicons name="ios-timer-outline" size={24} />
              </Pressable>
            )}
          </View>
          {!!restTime && (
            <View className="h-1 w-full overflow-hidden rounded-xl bg-gray-100">
              <AnimatedLinearGradient
                start={[0, 1]}
                end={[1, 0]}
                colors={['#DB2777', '#d946ef', '#c026d3']}
                style={progressStyle}
                className="h-full rounded-xl"
              />
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export default function PlanPage() {
  const db = useDatabase();
  const { planId } = useSearchParams();
  const [plan, setPlan] = useState<PlanModel>();
  const [exercises, setExercises] = useState<ExerciseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<ExerciseModel | null>(null);

  useEffectOnce(() => {
    (async () => {
      await db.write(async () => {
        const p = await db.collections.get<PlanModel>('plans').find(planId);
        const e = await db.collections
          .get<ExerciseModel>('exercises')
          .query(Q.where('planId', p.id))
          .fetch();

        setPlan(p);
        setExercises(Array.from(e));
        setLoading(false);
      }, `fetch plan ${planId}`);
    })();
  });

  if (loading) {
    return <PlanLoader />;
  }

  return (
    <View className="relative flex-1">
      <Animated.View
        className={cnb(
          'flex-1 h-full pt-6 shadow-2xl overflow-hidden mx-auto',
          expanded ? 'w-[90%] mt-2 rounded-2xl bg-white' : 'bg-gray-100 w-full',
        )}
      >
        <View className="mb-6 px-6">
          <Text className="text-4xl font-bold text-black">{plan.name}</Text>
          <Text className="text-sm">{plan.description}</Text>
        </View>
        <FlashList
          data={exercises}
          // eslint-disable-next-line no-underscore-dangle
          renderItem={({ item }) => (
            <Exercise
              id={item.id}
              name={item.name}
              description={item.description}
              restTime={item.restTime}
              expand={() => setExpanded(item)}
            />
          )}
          estimatedItemSize={163}
          fadingEdgeLength={32}
        />
      </Animated.View>
      <DetailedExerciseModal exercise={expanded} onDismiss={() => setExpanded(null)} />
    </View>
  );
}
