import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { cnb } from 'cnbuilder';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import type ExerciseModel from '../../database/models/exercise';
import type PlanModel from '../../database/models/plan';
import useDatabase from '../../hooks/useDatabase';
import type { Exercise, Plan } from '../../types';

const NoteModal = ({
  index,
  change,
  control,
  onDismiss,
}: {
  index: number;
  change: UseFormSetValue<Plan>;
  control: Control<Plan, any>;
  onDismiss: () => void;
}) => {
  const [value, setValue] = useState(control._formValues.exercises[index].notes);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <View className="absolute inset-0 z-10 bg-gray-100/40 pt-6">
        <View className="flex-1 rounded-t-3xl bg-white pt-2 shadow-2xl">
          <View className="mx-auto mb-6 h-1 w-1/4 shrink-0 rounded-xl bg-gray-200" />
          <View className="mb-6 flex shrink-0 flex-row items-center justify-between gap-3 px-6">
            <Pressable
              className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
              onPress={onDismiss}
            >
              <Text className="text-gray-500">
                <Ionicons name="ios-chevron-back" size={20} />
              </Text>
            </Pressable>
            <Text className="text-2xl font-bold text-black">Notes</Text>
            <Pressable
              className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
              onPress={() => {
                change(`exercises.${index}.notes`, value);
                onDismiss();
              }}
            >
              <Text className="text-gray-500">
                <Ionicons name="ios-checkmark" size={20} />
              </Text>
            </Pressable>
          </View>
          <TextInput
            multiline
            className="flex h-full w-full shrink px-6 text-base"
            placeholder="Write down your notes here..."
            textAlignVertical="top"
            autoFocus
            value={value}
            onChangeText={text => setValue(text || '')}
          />
        </View>
      </View>
    </Modal>
  );
};

const Item = ({
  index,
  name,
  description,
  restTime,
  control,
  editNotes,
}: Exercise & {
  index: number;
  control: Control<Plan, any>;
  editNotes: () => void;
}) => {
  return (
    <View className="mb-3.5 flex flex-row items-start justify-between rounded-2xl bg-white px-6 py-5 shadow-xl">
      <View className="w-full shrink">
        <Controller
          control={control}
          defaultValue={name}
          rules={{
            required: true,
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Exercise name"
              className="w-full text-2xl font-semibold"
            />
          )}
          name={`exercises.${index}.name`}
        />
        <Controller
          control={control}
          defaultValue={description}
          rules={{
            required: true,
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Exercise explanation"
              className="w-full text-sm text-black/75"
              multiline
            />
          )}
          name={`exercises.${index}.description`}
        />
        <Controller
          control={control}
          defaultValue={restTime}
          rules={{}}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              value={value?.toString()}
              placeholder="Resting time in seconds"
              className="w-full text-sm"
              keyboardType="numeric"
            />
          )}
          name={`exercises.${index}.restTime`}
        />
      </View>
      <View className="shrink-0">
        <Pressable onPress={editNotes}>
          <Text className="mt-1 text-fuchsia-600">
            <Ionicons name="ios-bookmark" size={24} />
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default function AddPlanPage() {
  const db = useDatabase();
  const { push } = useRouter();

  const [editingNotes, setEditingNotes] = useState<number | null>(null);

  const { control, handleSubmit, setValue } = useForm<Plan>();
  const { fields, append } = useFieldArray({
    // remove
    control,
    name: 'exercises',
  });

  const addExercise = useCallback(() => {
    append({
      name: '',
      description: '',
      restTime: null,
      notes: '',
    });
  }, [append]);

  const onSubmit = handleSubmit(async ({ name, description, exercises }) => {
    const id = await db.write(async () => {
      const plan = await db.collections.get<PlanModel>('plans').create(newPlan => {
        /* eslint-disable no-param-reassign */
        newPlan.name = name;
        newPlan.description = description;
        /* eslint-enable no-param-reassign */
      });

      const exerciseCollection = db.collections.get<ExerciseModel>('exercises');

      exercises.map(async (exercise, idx) => {
        await exerciseCollection.create(newExercise => {
          /* eslint-disable no-param-reassign */
          newExercise.name = exercise.name;
          newExercise.description = exercise.description;
          newExercise.restTime = Number(exercise.restTime) || 0;
          newExercise.notes = exercise.notes;
          newExercise.order = idx;
          newExercise.planId = plan.id;
          /* eslint-enable no-param-reassign */
        });
      });

      return plan.id;
    }, 'insert plan');

    push(`/plans/${id}`);
  });

  return (
    <View className="relative flex-1">
      <View
        className={cnb(
          'flex-1 h-full p-6 pb-1.5 bg-gray-100 shadow-2xl overflow-hidden mx-auto',
          typeof editingNotes === 'number' ? 'w-[90%] mt-2 rounded-2xl bg-white' : 'w-full',
        )}
      >
        <Controller
          control={control}
          rules={{
            required: true,
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Name your plan"
              className="text-4xl font-bold text-black"
              autoFocus
            />
          )}
          name="name"
        />
        <Controller
          control={control}
          rules={{
            required: true,
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Plan description"
              className="mb-6 text-sm"
            />
          )}
          name="description"
        />
        <View className="flex-1 shrink">
          <FlashList
            data={fields}
            renderItem={({ index }) => (
              <Item
                {...control._formValues.exercises[index]}
                index={index}
                control={control}
                editNotes={() => setEditingNotes(index)}
              />
            )}
            estimatedItemSize={163}
            fadingEdgeLength={32}
          />
        </View>
        <Pressable
          className="mt-1.5 flex w-full flex-row items-center justify-start rounded-xl bg-emerald-200 px-5 py-3"
          onPress={addExercise}
        >
          <Ionicons name="ios-add" size={24} color="#000000" />
          <Text className="ml-2 text-base font-bold uppercase text-black">Add exercise</Text>
        </Pressable>
        <Pressable
          onPress={onSubmit}
          className="mt-3 flex w-full flex-row items-center justify-start rounded-xl bg-fuchsia-200 px-5 py-3"
        >
          <Ionicons name="ios-checkmark" size={24} color="#000000" />
          <Text className="ml-2 text-base font-bold uppercase text-black">Save</Text>
        </Pressable>
      </View>
      {typeof editingNotes === 'number' && (
        <NoteModal
          index={editingNotes}
          change={setValue}
          control={control}
          onDismiss={() => setEditingNotes(null)}
        />
      )}
    </View>
  );
}
