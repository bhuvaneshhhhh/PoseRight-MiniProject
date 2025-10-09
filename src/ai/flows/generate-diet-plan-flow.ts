'use server';
/**
 * @fileOverview This flow generates a personalized diet plan for the user.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { FOODS } from '@/lib/foods';

const DietPlanInputSchema = z.object({
  height: z.string().optional().describe('User height in centimeters.'),
  weight: z.string().optional().describe('User weight in kilograms.'),
  activityLevel: z.enum(['normal', 'light', 'moderate', 'extremely_active']),
  dietaryPreference: z.enum(['vegetarian', 'non_vegetarian', 'vegan']),
});

const MealSchema = z.object({
  breakfast: z.string(),
  lunch: z.string(),
  dinner: z.string(),
});

const DayPlanSchema = z.object({
  day: z.string().describe('Day of the week (e.g., Monday).'),
  meals: MealSchema,
});

const DietPlanOutputSchema = z.object({
  plan: z.array(DayPlanSchema),
});

export type GenerateDietPlanInput = z.infer<typeof DietPlanInputSchema>;
export type GenerateDietPlanOutput = z.infer<typeof DietPlanOutputSchema>;

function getAvailableFoods(preference: GenerateDietPlanInput['dietaryPreference']) {
    let foodList = [...FOODS.common_veg, ...FOODS.fruits, ...FOODS.snacks];
    if (preference === 'non_vegetarian') {
        foodList = [...foodList, ...FOODS.common_non_veg, ...FOODS.south_indian_non_veg];
    }
    if(preference === 'vegetarian' || preference === 'vegan') {
         foodList = [...foodList, ...FOODS.south_indian_veg];
    }
    // Remove duplicates
    return [...new Set(foodList)];
}


export async function generateDietPlan(
  input: GenerateDietPlanInput
): Promise<GenerateDietPlanOutput> {
  return generateDietPlanFlow(input);
}

const dietPrompt = ai.definePrompt({
  name: 'dietPlanGenerator',
  input: {
    schema: z.object({
      ...DietPlanInputSchema.shape,
      availableFoods: z.array(z.string()),
    }),
  },
  output: { schema: DietPlanOutputSchema },
  prompt: `You are an expert nutritionist. Create a balanced 7-day diet plan for a user with the following profile:
- Height: {{{height_cm}}}
- Weight: {{{weight_kg}}}
- Activity Level: {{{activityLevel}}}
- Dietary Preference: {{{dietaryPreference}}}

The goal is a healthy, balanced diet. Use only the food items from the provided list. Ensure variety throughout the week. Structure the output as a 7-day plan, with breakfast, lunch, and dinner for each day.

Available foods:
{{{json availableFoods}}}
`,
});

const generateDietPlanFlow = ai.defineFlow(
  {
    name: 'generateDietPlanFlow',
    inputSchema: DietPlanInputSchema,
    outputSchema: DietPlanOutputSchema,
  },
  async (input) => {
    const availableFoods = getAvailableFoods(input.dietaryPreference);
    
    const { output } = await dietPrompt({
      ...input,
      availableFoods,
    });

    if (!output) {
      throw new Error('Failed to generate a diet plan from the model.');
    }
    
    return output;
  }
);
