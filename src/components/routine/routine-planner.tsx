
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Bot, Dumbbell, Loader2, Plus, Trash2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { EXERCISES } from '@/lib/exercises';

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

type CustomExercise = {
  id: string;
  name: string;
  focus: 'Upper Body' | 'Lower Body' | 'Core' | 'Cardio' | 'Full Body' | 'Rest';
};

type DailyRoutine = {
  day: string;
  exercises: CustomExercise[];
};

const initialRoutine: DailyRoutine[] = [
  { day: 'Monday', exercises: [] },
  { day: 'Tuesday', exercises: [] },
  { day: 'Wednesday', exercises: [] },
  { day: 'Thursday', exercises: [] },
  { day: 'Friday', exercises: [] },
  { day: 'Saturday', exercises: [] },
  { day: 'Sunday', exercises: [] },
];

function CustomRoutinePlanner() {
  const [schedule, setSchedule] = useState<DailyRoutine[]>(initialRoutine);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDay, setCurrentDay] = useState('');
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseFocus, setNewExerciseFocus] = useState<CustomExercise['focus']>('Upper Body');

  const handleAddExercise = () => {
    if (!newExerciseName.trim() || !currentDay) return;
    
    setSchedule(schedule.map(daySchedule => {
        if (daySchedule.day === currentDay) {
            return {
                ...daySchedule,
                exercises: [...daySchedule.exercises, { id: Date.now().toString(), name: newExerciseName, focus: newExerciseFocus }]
            }
        }
        return daySchedule;
    }));
    setNewExerciseName('');
    setIsDialogOpen(false);
  }

  const handleRemoveExercise = (day: string, exerciseId: string) => {
    setSchedule(schedule.map(daySchedule => {
        if (daySchedule.day === day) {
            return {
                ...daySchedule,
                exercises: daySchedule.exercises.filter(ex => ex.id !== exerciseId)
            }
        }
        return daySchedule;
    }))
  }
  
  const openDialog = (day: string) => {
    setCurrentDay(day);
    setIsDialogOpen(true);
  }
  return (
     <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {schedule.map(({ day, exercises }) => (
          <Card key={day} className="flex flex-col">
            <CardHeader className="flex-row items-center justify-between py-4 px-6">
              <CardTitle className="font-headline text-lg">{day}</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => openDialog(day)}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 space-y-2 px-6 pb-6">
              {exercises.length > 0 ? exercises.map(exercise => (
                <div key={exercise.id} className="group flex items-center justify-between rounded-md bg-muted p-2">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{exercise.name}</span>
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleRemoveExercise(day, exercise.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center pt-4">No exercises planned.</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader>
              <DialogTitle>Add Exercise to {currentDay}</DialogTitle>
              <DialogDescription>
                  Select an exercise from the list or add your own.
              </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="exercise-name" className="text-right">Name</Label>
                      <Input id="exercise-name" value={newExerciseName} onChange={(e) => setNewExerciseName(e.target.value)} className="col-span-3" placeholder="e.g. Bicep Curls" />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="exercise-focus" className="text-right">Focus</Label>
                        <Select onValueChange={(value: any) => setNewExerciseFocus(value)} defaultValue={newExerciseFocus}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select focus" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Upper Body">Upper Body</SelectItem>
                                <SelectItem value="Lower Body">Lower Body</SelectItem>
                                <SelectItem value="Core">Core</SelectItem>
                                <SelectItem value="Cardio">Cardio</SelectItem>
                                <SelectItem value="Full Body">Full Body</SelectItem>
                                <SelectItem value="Rest">Rest</SelectItem>
                            </SelectContent>
                        </Select>
                   </div>
              </div>
              <DialogFooter>
                  <Button onClick={handleAddExercise}>Add Exercise</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  )
}

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
      <TabsContent value="ai-generator" className="mt-4">
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
      <TabsContent value="custom-routine" className="mt-4">
        <CustomRoutinePlanner />
      </TabsContent>
    </Tabs>
  );
}

    