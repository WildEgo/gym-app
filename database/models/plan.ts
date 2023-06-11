import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

// @ts-ignore
export default class Plan extends Model {
  static table = 'plans';

  static associations = {
    exercises: { type: 'has_many', foreignKey: 'planId' },
  };

  @field('name') name!: string;

  @field('description') description!: string;

  @field('order') order!: number;
}
