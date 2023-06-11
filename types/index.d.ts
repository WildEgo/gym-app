export interface Exercise {
  name: string;
  description: string;
  restTime: number;
  notes: string;
}

export interface Plan {
  name: string;
  description: string;
  exercises: Exercise[];
}
