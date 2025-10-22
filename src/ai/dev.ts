'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/ask-chatbot.ts';
import '@/ai/flows/analyze-exercise-form.ts';
import '@/ai/flows/identify-exercise-from-pose.ts';
import '@/ai/flows/generate-routine-flow.ts';
import '@/ai/flows/generate-diet-plan-flow.ts';
import '@/ai/flows/store-file-flow.ts';
import '@/ai/flows/generate-audio-feedback-flow.ts';
