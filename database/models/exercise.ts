import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

// @ts-ignore
export default class Exercise extends Model {
  static table = 'exercises';

  static associations = {
    plan: { type: 'belongs_to', key: 'planId' },
  };

  @field('name') name!: string;

  @field('description') description!: string;

  @field('restTime') restTime!: number;

  @field('notes') notes!: string;

  @field('order') order!: number;

  @field('planId') planId!: string;
}
