import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'plans',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'order', type: 'number' },
        { name: 'createdAt', type: 'number' },
        { name: 'updatedAt', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'exercises',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'restTime', type: 'number' },
        { name: 'notes', type: 'string' },
        { name: 'order', type: 'number' },
        { name: 'createdAt', type: 'number' },
        { name: 'updatedAt', type: 'number' },
        { name: 'planId', type: 'string', isIndexed: true },
      ],
    }),
  ],
});

export const schemaMigrations = {
  migrations: [
    {
      toVersion: 1,
      steps: [
        {
          name: 'create plans and exercises tables',
          up: database => {
            const plansTable = database.schema.tables.find(table => table.name === 'plans');
            const exercisesTable = database.schema.tables.find(table => table.name === 'exercises');
            return Promise.all([
              database.action(() => plansTable.create()),
              database.action(() => exercisesTable.create()),
            ]);
          },
        },
      ],
    },
  ],
};
