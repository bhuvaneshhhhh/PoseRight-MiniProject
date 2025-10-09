'use server';
/**
 * @fileOverview This flow identifies the exercise a user is performing based on their pose.
 *
 * It exports the following:
 * - identifyExerciseFromPose: The main function to identify the exercise.
 * - IdentifyExerciseFromPoseInput: The Zod schema for the input.
 * - IdentifyExerciseFromPoseOutput: The Zod schema for the output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {WORKOUTS} from '@/lib/workouts';

// Flatten the WORKOUTS object into a single array of exercise names
const allExercises = Object.values(WORKOUTS).flatMap(category =>
  Object.values(category).flat()
);

const IdentifyExerciseFromPoseInputSchema = z.object({
  poseData: z.any().describe('The pose landmark data from MediaPipe.'),
});

const IdentifyExerciseFromPoseOutputSchema = z.object({
  exerciseName: z
    .string()
    .nullable()
    .describe(
      `The name of the identified exercise from the provided list, or null if no match is found.`
    ),
});

export type IdentifyExerciseFromPoseInput = z.infer<
  typeof IdentifyExerciseFromPoseInputSchema
>;
export type IdentifyExerciseFromPoseOutput = z.infer<
  typeof IdentifyExerciseFromPoseOutputSchema
>;

const identificationPrompt = ai.definePrompt({
  name: 'exerciseIdentification',
  input: {schema: IdentifyExerciseFromPoseInputSchema},
  output: {
    schema: z.object({
      exerciseName: z.enum(allExercises as [string, ...string[]]).nullable(),
    }),
  },
  prompt: `You are a fitness expert. Based on the following pose data, identify which of these exercises the user is performing.

Available exercises: ${allExercises.join(', ')}

If the pose clearly matches one of the exercises, return its name. If the pose is unclear, ambiguous, or doesn't match any exercise, return null.

Pose data:
{{{json poseData}}}
`,
});

const identifyExerciseFlow = ai.defineFlow(
  {
    name: 'identifyExerciseFlow',
    inputSchema: IdentifyExerciseFromPoseInputSchema,
    outputSchema: IdentifyExerciseFromPoseOutputSchema,
  },
  async input => {
    const {output} = await identificationPrompt(input);
    if (!output) {
      return { exerciseName: null };
    }
    return { exerciseName: output.exerciseName || null };
  }
);

export async function identifyExerciseFromPose(
  input: IdentifyExerciseFromPoseInput
): Promise<IdentifyExerciseFromPoseOutput> {
  return identifyExerciseFlow(input);
}
