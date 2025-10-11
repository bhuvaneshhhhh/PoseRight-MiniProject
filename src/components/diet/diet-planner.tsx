
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Bot, Loader2, Plus, Trash2 } from 'lucide-react';
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
import { Label } from '../ui/label';

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

type Meal = {
  id: string;
  name: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner';
};

type DailyDiet = {
  day: string;
  meals: Meal[];
};

const initialDiet: DailyDiet[] = [
  { day: 'Monday', meals: [] },
  { day: 'Tuesday', meals: [] },
  { day: 'Wednesday', meals: [] },
  { day: 'Thursday', meals: [] },
  { day: 'Friday', meals: [] },
  { day: 'Saturday', meals: [] },
  { day: 'Sunday', meals: [] },
];

function CustomDietPlanner() {
  const [schedule, setSchedule] = useState<DailyDiet[]>(initialDiet);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDay, setCurrentDay] = useState('');
  const [newMealName, setNewMealName] = useState('');
  const [newMealType, setNewMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner'>('Breakfast');

  const handleAddMeal = () => {
    if (!newMealName.trim() || !currentDay) return;
    
    setSchedule(schedule.map(daySchedule => {
        if (daySchedule.day === currentDay) {
            return {
                ...daySchedule,
                meals: [...daySchedule.meals, { id: Date.now().toString(), name: newMealName, type: newMealType }]
            }
        }
        return daySchedule;
    }));
    setNewMealName('');
    setIsDialogOpen(false);
  }

  const handleRemoveMeal = (day: string, mealId: string) => {
    setSchedule(schedule.map(daySchedule => {
        if (daySchedule.day === day) {
            return {
                ...daySchedule,
                meals: daySchedule.meals.filter(m => m.id !== mealId)
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
        {schedule.map(({ day, meals }) => (
          <Card key={day} className="flex flex-col">
            <CardHeader className="flex-row items-center justify-between py-4 px-6">
              <CardTitle className="font-headline text-lg">{day}</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => openDialog(day)}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 space-y-2 px-6 pb-6">
              {meals.length > 0 ? meals.map(meal => (
                <div key={meal.id} className="group flex items-center justify-between rounded-md bg-muted p-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{meal.type}</span>
                    <span className="text-sm">{meal.name}</span>
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleRemoveMeal(day, meal.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center pt-4">No meals planned.</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader>
              <DialogTitle>Add Meal to {currentDay}</DialogTitle>
              <DialogDescription>
                  Plan a new meal for your diet.
              </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="meal-name" className="text-right">Name</Label>
                      <Input id="meal-name" value={newMealName} onChange={(e) => setNewMealName(e.target.value)} className="col-span-3" placeholder="e.g. Chicken Salad" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="meal-type" className="text-right">Type</Label>
                      <Select onValueChange={(value: any) => setNewMealType(value)} defaultValue={newMealType}>
                          <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Breakfast">Breakfast</SelectItem>
                              <SelectItem value="Lunch">Lunch</SelectItem>
                              <SelectItem value="Dinner">Dinner</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              <DialogFooter>
                  <Button onClick={handleAddMeal}>Add Meal</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}


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
      <TabsContent value="ai-generator" className="mt-4">
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
      <TabsContent value="custom-plan" className="mt-4">
        <CustomDietPlanner />
      </TabsContent>
    </Tabs>
  );
}

    