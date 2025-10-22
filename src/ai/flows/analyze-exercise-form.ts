'use server';

/**
 * @fileOverview This flow analyzes the user's exercise form and provides feedback.
 *
 * It exports the following:
 * - analyzeExerciseForm: The main function to analyze the form.
 * - FormAnalysis: The Zod schema for the output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { WORKOUTS_DATA } from '@/lib/poses';

const LandmarkSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  visibility: z.number().optional(),
});

const AnalyzeExerciseFormInputSchema = z.object({
  exerciseName: z.string().describe('The name of the exercise being performed.'),
  landmarks: z.array(LandmarkSchema).describe('A snapshot of the user\'s pose landmarks.'),
});

const FormAnalysisSchema = z.object({
  formScore: z
    .number()
    .min(0)
    .max(100)
    .describe('A percentage score (0-100) rating the user\'s form.'),
  formAnalysis: z
    .array(z.string())
    .describe('A detailed, bullet-pointed list of what the user is doing right and wrong.'),
  feedback: z
    .string()
    .describe('A single, concise, and actionable piece of advice for immediate correction.'),
  vocalizationNeeded: z.boolean().describe('Whether the feedback should be spoken aloud.'),
  instructions: z.string().describe('The feedback text to be vocalized if needed.')
});

export type FormAnalysis = z.infer<typeof FormAnalysisSchema>;

const analysisPrompt = ai.definePrompt({
  name: 'formAnalysisPrompt',
  input: { schema: z.object({
      exerciseName: z.string(),
      landmarks: z.string(), // Pass landmarks as JSON string
      idealForm: z.string(), // Pass ideal form rules as JSON string
  })},
  output: { schema: FormAnalysisSchema },
  prompt: `You are an expert AI fitness coach specializing in real-time form correction.
A user is performing a '{{{exerciseName}}}'.
Analyze their current pose (landmarks) against the ideal form for that exercise.

Ideal Form Rules for {{{exerciseName}}}:
{{{idealForm}}}

User's Current Pose Landmarks:
{{{landmarks}}}

Based on this, generate a structured analysis.
- Calculate a 'formScore' from 0-100. 100 is perfect. Deduct points for each deviation from the ideal form.
- Provide a 'formAnalysis' as a list of bullet points. Start with positive reinforcement, then list areas for improvement.
- Generate a single, concise, encouraging, and actionable 'feedback' message for immediate correction. This is the most critical cue.
- If the form score is below 80 and there's a clear mistake, set 'vocalizationNeeded' to true and copy the feedback message to 'instructions'. Otherwise, set it to false and instructions to an empty string.
`,
});

const analyzeExerciseFormFlow = ai.defineFlow(
  {
    name: 'analyzeExerciseFormFlow',
    inputSchema: AnalyzeExerciseFormInputSchema,
    outputSchema: FormAnalysisSchema,
  },
  async ({ exerciseName, landmarks }) => {
    const exerciseData = WORKOUTS_DATA[exerciseName as keyof typeof WORKOUTS_DATA];
    if (!exerciseData) {
      throw new Error(`Ideal form data for exercise "${exerciseName}" not found.`);
    }

    const { output } = await analysisPrompt({
        exerciseName,
        landmarks: JSON.stringify(landmarks, null, 2),
        idealForm: JSON.stringify(exerciseData.stages, null, 2),
    });

    if (!output) {
      throw new Error('Failed to get form analysis from the model.');
    }
    
    return output;
  }
);

export async function analyzeExerciseForm(
  input: z.infer<typeof AnalyzeExerciseFormInputSchema>
): Promise<FormAnalysis> {
  return analyzeExerciseFormFlow(input);
}
