
'use server';
/**
 * @fileOverview This flow generates corrective feedback for a user's pose.
 *
 * It exports the following:
 * - generateFeedbackForPose: The main function to generate feedback.
 * - GenerateFeedbackForPoseInput: The Zod schema for the input.
 * - GenerateFeedbackForPoseOutput: The Zod schema for the output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateFeedbackForPoseInputSchema = z.object({
  exerciseName: z.string().describe('The name of the exercise being performed.'),
  issues: z.array(z.string()).describe('A list of detected form issues.'),
});

const GenerateFeedbackForPoseOutputSchema = z.object({
  feedback: z
    .string()
    .describe('A concise, encouraging, and actionable feedback message for the user.'),
});

export type GenerateFeedbackForPoseInput = z.infer<
  typeof GenerateFeedbackForPoseInputSchema
>;
export type GenerateFeedbackForPoseOutput = z.infer<
  typeof GenerateFeedbackForPoseOutputSchema
>;

const feedbackPrompt = ai.definePrompt({
  name: 'feedbackGeneration',
  input: { schema: GenerateFeedbackForPoseInputSchema },
  output: { schema: GenerateFeedbackForPoseOutputSchema },
  prompt: `You are an expert AI fitness coach. A user is performing a '{{{exerciseName}}}'.
They are making the following mistakes: {{{json issues}}}.

Generate a single, concise, and encouraging sentence of feedback to help them correct their form.
Start with a positive reinforcement if possible, then give the most important correction.
Example: "Great effort! Try to keep your back a little straighter."
Another example: "You've got the motion! Focus on getting your hips lower."`,
});

const generateFeedbackFlow = ai.defineFlow(
  {
    name: 'generateFeedbackFlow',
    inputSchema: GenerateFeedbackForPoseInputSchema,
    outputSchema: GenerateFeedbackForPoseOutputSchema,
  },
  async input => {
    // If there are no issues, return a default positive message.
    if (input.issues.length === 0) {
      return { feedback: 'Excellent form! Keep it up.' };
    }

    const { output } = await feedbackPrompt(input);
    if (!output) {
      return { feedback: 'Keep working on your form.' };
    }
    return { feedback: output.feedback };
  }
);

export async function generateFeedbackForPose(
  input: GenerateFeedbackForPoseInput
): Promise<GenerateFeedbackForPoseOutput> {
  return generateFeedbackFlow(input);
}
