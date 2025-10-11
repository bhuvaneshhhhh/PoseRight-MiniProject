'use client';

import { Dumbbell, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type Workout = {
  id: string;
  name: string;
  type: 'Cardio' | 'Strength' | 'Flexibility' | 'Rest Day';
};

type DailySchedule = {
  day: string;
  workouts: Workout[];
};

const initialSchedule: DailySchedule[] = [
  { day: 'Monday', workouts: [{ id: '1', name: 'Full Body Strength', type: 'Strength' }] },
  { day: 'Tuesday', workouts: [{ id: '2', name: '30-min HIIT', type: 'Cardio' }] },
  { day: 'Wednesday', workouts: [{ id: '3', name: 'Active Recovery', type: 'Rest Day' }] },
  { day: 'Thursday', workouts: [{ id: '4', name: 'Upper Body & Core', type: 'Strength' }] },
  { day: 'Friday', workouts: [{ id: '5', name: 'Evening Run', type: 'Cardio' }] },
  { day: 'Saturday', workouts: [{ id: '6', name: 'Yoga Session', type: 'Flexibility' }] },
  { day: 'Sunday', workouts: [{ id: '7', name: 'Rest', type: 'Rest Day' }] },
];

export function SchedulePlanner() {
  const [schedule, setSchedule] = useState<DailySchedule[]>(initialSchedule);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDay, setCurrentDay] = useState('');
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [newWorkoutType, setNewWorkoutType] = useState<'Cardio' | 'Strength' | 'Flexibility' | 'Rest Day'>('Strength');

  const handleAddWorkout = () => {
    if (!newWorkoutName.trim() || !currentDay) return;
    
    setSchedule(schedule.map(daySchedule => {
        if (daySchedule.day === currentDay) {
            return {
                ...daySchedule,
                workouts: [...daySchedule.workouts, { id: Date.now().toString(), name: newWorkoutName, type: newWorkoutType }]
            }
        }
        return daySchedule;
    }));
    setNewWorkoutName('');
    setIsDialogOpen(false);
  }

  const handleRemoveWorkout = (day: string, workoutId: string) => {
    setSchedule(schedule.map(daySchedule => {
        if (daySchedule.day === day) {
            return {
                ...daySchedule,
                workouts: daySchedule.workouts.filter(w => w.id !== workoutId)
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
        {schedule.map(({ day, workouts }) => (
          <Card key={day} className="flex flex-col">
            <CardHeader className="flex-row items-center justify-between py-4 px-6">
              <CardTitle className="font-headline text-lg">{day}</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => openDialog(day)}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 space-y-2 px-6 pb-6">
              {workouts.length > 0 ? workouts.map(workout => (
                <div key={workout.id} className="group flex items-center justify-between rounded-md bg-muted p-2">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{workout.name}</span>
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleRemoveWorkout(day, workout.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center pt-4">No workouts planned.</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader>
              <DialogTitle>Add workout to {currentDay}</DialogTitle>
              <DialogDescription>
                  Plan a new activity for your schedule.
              </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="workout-name" className="text-right">Name</Label>
                      <Input id="workout-name" value={newWorkoutName} onChange={(e) => setNewWorkoutName(e.target.value)} className="col-span-3" placeholder="e.g. Morning Jog" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="workout-type" className="text-right">Type</Label>
                      <Select onValueChange={(value: any) => setNewWorkoutType(value)} defaultValue={newWorkoutType}>
                          <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Strength">Strength</SelectItem>
                              <SelectItem value="Cardio">Cardio</SelectItem>
                              <SelectItem value="Flexibility">Flexibility</SelectItem>
                              <SelectItem value="Rest Day">Rest Day</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              <DialogFooter>
                  <Button onClick={handleAddWorkout}>Add Workout</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
