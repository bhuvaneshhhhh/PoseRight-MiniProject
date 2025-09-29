import Link from 'next/link';
import { SignupForm } from '@/components/auth/signup-form';
import { Logo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Logo className="h-12 w-auto text-primary" />
          <h1 className="font-headline text-3xl font-bold text-foreground">
            Create your TempoAI Account
          </h1>
          <p className="text-muted-foreground">
            Start your personalized fitness journey today.
          </p>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Sign Up</CardTitle>
            <CardDescription>Fill in your details to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
          <CardFooter className="flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?
              <Button variant="link" asChild className="p-1">
                <Link href="/">Login</Link>
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
