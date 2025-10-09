'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Bot, Loader2, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { generateDietPlan } from '@/ai/flows/generate-diet-plan-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';

const dietFormSchema = z.object({
  height: z.string().optional(),
  weight: z.string().optional(),
  activityLevel: z.enum(['normal', 'light', 'moderate', 'extremely_active']),
  dietaryPreference: z.enum(['vegetarian', 'non_vegetarian', 'vegan']),
});

type DietPlan = {
  day: string;
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
};

export function DietPlanner() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<DietPlan[] | null>(null);

  const form = useForm<z.infer<typeof dietFormSchema>>({
    resolver: zodResolver(dietFormSchema),
    defaultValues: {
      activityLevel: 'light',
      dietaryPreference: 'vegetarian',
    },
  });

  async function onSubmit(values: z.infer<typeof dietFormSchema>) {
    setIsLoading(true);
    setGeneratedPlan(null);
    try {
      const result = await generateDietPlan(values);
      setGeneratedPlan(result.plan);
    } catch (error) {
      console.error('Failed to generate diet plan:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate a diet plan. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Tabs defaultValue="ai-generator">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="ai-generator">AI Diet Generator</TabsTrigger>
        <TabsTrigger value="custom-plan">My Custom Plan</TabsTrigger>
      </TabsList>
      <TabsContent value="ai-generator">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Personalize Your Diet</CardTitle>
              <CardDescription>Tell us about yourself to generate a tailored diet plan.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height (cm)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 175" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (kg)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 70" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="activityLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your activity level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="light">Lightly Active</SelectItem>
                            <SelectItem value="moderate">Moderately Active</SelectItem>
                            <SelectItem value="extremely_active">Extremely Active</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="dietaryPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dietary Preference</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your dietary preference" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vegetarian">Vegetarian</SelectItem>
                            <SelectItem value="non_vegetarian">Non-Vegetarian</SelectItem>
                            <SelectItem value="vegan">Vegan</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    Generate My Diet
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Your AI-Generated Diet Plan</CardTitle>
              <CardDescription>A 7-day plan based on your inputs. Regenerate for new ideas.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {isLoading && (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                {!isLoading && !generatedPlan && (
                  <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                    <div className="space-y-2">
                        <p>Your generated diet plan will appear here.</p>
                        <p className="text-xs">Fill out the form and click generate!</p>
                    </div>
                  </div>
                )}
                {generatedPlan && (
                  <div className="space-y-4">
                    {generatedPlan.map((dayPlan) => (
                      <div key={dayPlan.day}>
                        <h3 className="font-bold text-primary">{dayPlan.day}</h3>
                        <div className="mt-2 space-y-1 rounded-md border p-2 text-sm">
                          <p><strong>Breakfast:</strong> {dayPlan.meals.breakfast}</p>
                          <p><strong>Lunch:</strong> {dayPlan.meals.lunch}</p>
                          <p><strong>Dinner:</strong> {dayPlan.meals.dinner}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      <TabsContent value="custom-plan">
        <Card>
          <CardHeader>
            <CardTitle>Create Your Custom Diet Plan</CardTitle>
             <CardDescription>This feature is coming soon! Plan your meals for the week.</CardDescription>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>Custom diet planning will be available in a future update.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
