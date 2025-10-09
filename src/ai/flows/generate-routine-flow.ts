'use server';
/**
 * @fileOverview This flow generates a personalized workout routine.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { EXERCISES } from '@/lib/exercises';

const RoutineInputSchema = z.object({
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  goal: z.enum(['strength', 'hypertrophy', 'endurance', 'fat_loss']),
});

const ExerciseSchema = z.object({
  name: z.string(),
  sets: z.string(),
  reps: z.string(),
});

const WorkoutDaySchema = z.object({
  day: z.string().describe('Day of the week (e.g., Monday).'),
  focus: z.string().describe('The main focus of the day (e.g., Upper Body, Lower Body, Rest).'),
  exercises: z.array(ExerciseSchema),
});

const RoutineOutputSchema = z.object({
  routine: z.array(WorkoutDaySchema),
});

export type GenerateRoutineInput = z.infer<typeof RoutineInputSchema>;
export type GenerateRoutineOutput = z.infer<typeof RoutineOutputSchema>;


export async function generateRoutine(
  input: GenerateRoutineInput
): Promise<GenerateRoutineOutput> {
  return generateRoutineFlow(input);
}


const routinePrompt = ai.definePrompt({
  name: 'routineGenerator',
  input: {
    schema: z.object({
      ...RoutineInputSchema.shape,
      availableExercises: z.array(z.string()),
    }),
  },
  output: { schema: RoutineOutputSchema },
  prompt: `You are an expert fitness coach. Create a structured 7-day workout routine for a user with the following profile:
- Fitness Level: {{{fitnessLevel}}}
- Goal: {{{goal}}}

Structure the routine with a clear weekly split (e.g., Upper/Lower, Push/Pull/Legs). Include 1-2 rest days.
For each workout day, provide 4-6 exercises.
For each exercise, specify the number of sets and reps appropriate for the user's goal and fitness level.
Use ONLY exercises from the provided list.

Available exercises:
{{{json availableExercises}}}
`,
});


const generateRoutineFlow = ai.defineFlow(
  {
    name: 'generateRoutineFlow',
    inputSchema: RoutineInputSchema,
    outputSchema: RoutineOutputSchema,
  },
  async (input) => {
    const { output } = await routinePrompt({
      ...input,
      availableExercises: EXERCISES,
    });
    if (!output) {
      throw new Error('Failed to generate a routine from the model.');
    }
    return output;
  }
);
