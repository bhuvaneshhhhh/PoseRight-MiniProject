'use server';

/**
 * @fileOverview A flow for answering user questions about fitness topics, maintaining context.
 *
 * - askChatbot - A function that handles user questions and returns AI-generated answers.
 * - AskChatbotInput - The input type for the askChatbot function.
 * - AskChatbotOutput - The return type for the askChatbot function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const AskChatbotInputSchema = z.object({
  question: z.string().describe('The user question about fitness.'),
  history: z.array(MessageSchema).optional().describe('The conversation history.'),
});
export type AskChatbotInput = z.infer<typeof AskChatbotInputSchema>;

export const AskChatbotOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user question.'),
});
export type AskChatbotOutput = z.infer<typeof AskChatbotOutputSchema>;

export async function askChatbot(input: AskChatbotInput): Promise<AskChatbotOutput> {
  return askChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askChatbotPrompt',
  input: { schema: AskChatbotInputSchema },
  output: { schema: AskChatbotOutputSchema },
  prompt: `You are an expert AI fitness coach.
A user has asked the following question about fitness.
Use the provided conversation history to maintain context and provide a relevant, helpful, and concise answer.

{{#if history}}
Conversation History:
{{#each history}}
- {{role}}: {{content}}
{{/each}}
{{/if}}

New User Question: {{{question}}}

Provide a helpful and informative answer.`,
});

const askChatbotFlow = ai.defineFlow(
  {
    name: 'askChatbotFlow',
    inputSchema: AskChatbotInputSchema,
    outputSchema: AskChatbotOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
