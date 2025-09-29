'use client';

import { BarChart, LineChart, TrendingUp } from 'lucide-react';
import { Bar, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart as RechartsBarChart, LineChart as RechartsLineChart } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const weeklyActivityData = [
  { day: 'Mon', minutes: 30 },
  { day: 'Tue', minutes: 45 },
  { day: 'Wed', minutes: 0 },
  { day: 'Thu', minutes: 60 },
  { day: 'Fri', minutes: 40 },
  { day: 'Sat', minutes: 90 },
  { day: 'Sun', minutes: 20 },
];

const weightProgressData = [
  { week: '1', weight: 180 },
  { week: '2', weight: 179 },
  { week: '3', weight: 179.5 },
  { week: '4', weight: 178 },
  { week: '5', weight: 177 },
  { week: '6', weight: 176 },
];

const chartConfig: ChartConfig = {
  minutes: {
    label: 'Minutes',
    color: 'hsl(var(--primary))',
  },
  weight: {
    label: 'Weight (lbs)',
    color: 'hsl(var(--accent))',
  },
};

const fitnessTips = [
    "Consistency is key. Even 15 minutes a day makes a difference.",
    "Proper hydration is crucial for performance and recovery. Drink plenty of water.",
    "Don't skip your warm-up. It prepares your muscles and prevents injuries.",
    "Listen to your body. Rest days are as important as workout days.",
    "A balanced diet complements your workout routine. Focus on whole foods."
]

export function ProgressDashboard() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <BarChart className="h-6 w-6" />
            Weekly Activity
          </CardTitle>
          <CardDescription>Your total workout minutes this week.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <RechartsBarChart data={weeklyActivityData} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis />
              <Tooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="minutes" fill="var(--color-minutes)" radius={8} />
            </RechartsBarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Weight Progress
          </CardTitle>
          <CardDescription>Your weight tracking over the last 6 weeks.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <RechartsLineChart data={weightProgressData} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="week" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip cursor={false} content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="weight" stroke="var(--color-weight)" strokeWidth={3} dot={true} />
            </RechartsLineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Quick Tips</CardTitle>
           <CardDescription>Some advice for your fitness journey.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="space-y-4">
                {fitnessTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <span className="text-sm text-muted-foreground">{tip}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
