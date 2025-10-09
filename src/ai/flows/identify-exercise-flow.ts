'use server';
/**
 * @fileOverview This flow identifies a user's exercise from pose data.
 *
 * It exports the following:
 * - identifyExerciseFromPose: The main function to identify the exercise.
 * - IdentifyExerciseFromPoseInput: The Zod schema for the input.
 * - IdentifyExerciseFromPoseOutput: The Zod schema for the output.
 */

import { ai } from '@/ai/genkit';
import { WORKOUTS_DATA } from '@/lib/poses';
import { z } from 'zod';

const LandmarkSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  visibility: z.number().optional(),
});

export const IdentifyExerciseFromPoseInputSchema = z.object({
  landmarks: z.array(LandmarkSchema),
});

const exerciseNames = Object.keys(WORKOUTS_DATA) as [
  keyof typeof WORKOUTS_DATA,
  ...(keyof typeof WORKOUTS_DATA)[]
];

export const IdentifyExerciseFromPoseOutputSchema = z.object({
  exerciseName: z.enum(exerciseNames).nullable(),
});

export type IdentifyExerciseFromPoseInput = z.infer<
  typeof IdentifyExerciseFromPoseInputSchema
>;
export type IdentifyExerciseFromPoseOutput = z.infer<
  typeof IdentifyExerciseFromPoseOutputSchema
>;

const identificationPrompt = ai.definePrompt({
  name: 'exerciseIdentification',
  input: { schema: IdentifyExerciseFromPoseInputSchema },
  output: { schema: IdentifyExerciseFromPoseOutputSchema },
  prompt: `You are an expert in fitness and human pose estimation.
Analyze the provided pose landmarks and identify which of the following exercises the person is performing.
The possible exercises are: ${exerciseNames.join(', ')}.

If the pose does not match any of the exercises, or if the person is just standing, respond with null.

Here is the landmark data:
{{{json landmarks}}}
`,
});

const identifyExerciseFlow = ai.defineFlow(
  {
    name: 'identifyExerciseFlow',
    inputSchema: IdentifyExerciseFromPoseInputSchema,
    outputSchema: IdentifyExerciseFromPoseOutputSchema,
  },
  async input => {
    const { output } = await identificationPrompt(input);
    if (!output) {
      return { exerciseName: null };
    }
    return output;
  }
);

export async function identifyExerciseFromPose(
  input: IdentifyExerciseFromPoseInput
): Promise<IdentifyExerciseFromPoseOutput> {
  return identifyExerciseFlow(input);
}
