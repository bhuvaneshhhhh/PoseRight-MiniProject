import { ProfileForm } from '@/components/profile/profile-form';

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <header>
        <h1 className="font-headline text-3xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and personal information.</p>
      </header>
      <div className="max-w-2xl">
        <ProfileForm />
      </div>
    </div>
  );
}
