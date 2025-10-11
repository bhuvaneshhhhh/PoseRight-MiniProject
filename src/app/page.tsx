import Link from 'next/link';
import LoginPageClient from '@/components/auth/login-page-client';
import { Logo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Logo className="h-12 w-auto text-primary" />
          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-foreground">
            Welcome back to PoseRight-AI
          </h1>
          <p className="text-muted-foreground">
            Your personal AI fitness companion.
          </p>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Login</CardTitle>
            <CardDescription>Enter your credentials to access your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginPageClient />
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Don't have an account?
              <Button variant="link" asChild className="p-1">
                <Link href="/signup">Sign up</Link>
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
