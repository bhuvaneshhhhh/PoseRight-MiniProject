'use server';

/**
 * @fileOverview A flow for answering user questions about fitness topics.
 *
 * - aiFitnessCoachQuestions - A function that handles user questions and returns AI-generated answers.
 * - AIFitnessCoachQuestionsInput - The input type for the aiFitnessCoachQuestions function.
 * - AIFitnessCoachQuestionsOutput - The return type for the aiFitnessCoachQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIFitnessCoachQuestionsInputSchema = z.object({
  question: z.string().describe('The user question about fitness.'),
});
export type AIFitnessCoachQuestionsInput = z.infer<typeof AIFitnessCoachQuestionsInputSchema>;

const AIFitnessCoachQuestionsOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user question.'),
});
export type AIFitnessCoachQuestionsOutput = z.infer<typeof AIFitnessCoachQuestionsOutputSchema>;

export async function aiFitnessCoachQuestions(input: AIFitnessCoachQuestionsInput): Promise<AIFitnessCoachQuestionsOutput> {
  return aiFitnessCoachQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiFitnessCoachQuestionsPrompt',
  input: {schema: AIFitnessCoachQuestionsInputSchema},
  output: {schema: AIFitnessCoachQuestionsOutputSchema},
  prompt: `You are an AI fitness coach. A user has asked the following question about fitness: {{{question}}}. Provide a helpful and informative answer.`,
});

const aiFitnessCoachQuestionsFlow = ai.defineFlow(
  {
    name: 'aiFitnessCoachQuestionsFlow',
    inputSchema: AIFitnessCoachQuestionsInputSchema,
    outputSchema: AIFitnessCoachQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
