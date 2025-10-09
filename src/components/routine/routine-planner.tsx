'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Bot, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { generateRoutine } from '@/ai/flows/generate-routine-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';

const routineFormSchema = z.object({
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  goal: z.enum(['strength', 'hypertrophy', 'endurance', 'fat_loss']),
});

type WorkoutDay = {
  day: string;
  focus: string;
  exercises: {
    name: string;
    sets: string;
    reps: string;
  }[];
};

export function RoutinePlanner() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedRoutine, setGeneratedRoutine] = useState<WorkoutDay[] | null>(null);

  const form = useForm<z.infer<typeof routineFormSchema>>({
    resolver: zodResolver(routineFormSchema),
    defaultValues: {
      fitnessLevel: 'beginner',
      goal: 'strength',
    },
  });

  async function onSubmit(values: z.infer<typeof routineFormSchema>) {
    setIsLoading(true);
    setGeneratedRoutine(null);
    try {
      const result = await generateRoutine(values);
      setGeneratedRoutine(result.routine);
    } catch (error) {
      console.error('Failed to generate routine:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate a routine. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Tabs defaultValue="ai-generator">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="ai-generator">AI Routine Generator</TabsTrigger>
        <TabsTrigger value="custom-routine">My Custom Routine</TabsTrigger>
      </TabsList>
      <TabsContent value="ai-generator">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Personalize Your Routine</CardTitle>
              <CardDescription>Tell us your goals to generate a tailored workout plan.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="fitnessLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fitness Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your fitness level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="goal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Goal</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your primary goal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="strength">Strength</SelectItem>
                            <SelectItem value="hypertrophy">Muscle Gain (Hypertrophy)</SelectItem>
                            <SelectItem value="endurance">Endurance</SelectItem>
                            <SelectItem value="fat_loss">Fat Loss</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    Generate My Routine
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Your AI-Generated Routine</CardTitle>
              <CardDescription>A 7-day plan based on your inputs. Regenerate for new ideas.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {isLoading && (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                {!isLoading && !generatedRoutine && (
                  <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                     <div className="space-y-2">
                        <p>Your generated routine will appear here.</p>
                        <p className="text-xs">Fill out the form and click generate!</p>
                    </div>
                  </div>
                )}
                {generatedRoutine && (
                  <div className="space-y-4">
                    {generatedRoutine.map((day) => (
                      <div key={day.day}>
                        <h3 className="font-bold text-primary">
                          {day.day} - {day.focus}
                        </h3>
                        <div className="mt-2 space-y-1 rounded-md border p-2 text-sm">
                          {day.exercises.map((ex) => (
                            <p key={ex.name}>
                              <strong>{ex.name}:</strong> {ex.sets} sets of {ex.reps} reps
                            </p>
                          ))}
                           {day.exercises.length === 0 && <p>Rest Day</p>}
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
      <TabsContent value="custom-routine">
        <Card>
          <CardHeader>
            <CardTitle>Create Your Custom Routine</CardTitle>
             <CardDescription>This feature is coming soon! Build your perfect workout week.</CardDescription>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>Custom routine planning will be available in a future update.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
