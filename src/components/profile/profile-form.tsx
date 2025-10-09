'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { User, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import {
  useFirebase,
  useDoc,
  useMemoFirebase,
  setDocumentNonBlocking,
} from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { storeFile } from '@/ai/flows/store-file-flow';

const formSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email address'),
  bio: z.string().max(160, 'Bio is too long').optional(),
  profilePicture: z.string().url().optional(),
});

type UserProfile = z.infer<typeof formSchema>;

export function ProfileForm() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { firestore, user } = useFirebase();

  const userDocRef = useMemoFirebase(
    () =>
      firestore && user
        ? doc(firestore, 'users', user.uid, 'profile', 'data')
        : null,
    [firestore, user]
  );

  const { data: userProfile, isLoading } = useDoc<UserProfile>(userDocRef);

  const form = useForm<UserProfile>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      bio: '',
      profilePicture: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset(userProfile);
    } else if (user) {
      form.reset({
        name: user.displayName || '',
        email: user.email || '',
        bio: '',
        profilePicture: user.photoURL || '',
      });
    }
  }, [userProfile, user, form]);

  const handlePictureChangeClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const filePath = `profile-pictures/${user.uid}/${file.name}`;

        const { downloadUrl } = await storeFile({ filePath, dataUrl });

        form.setValue('profilePicture', downloadUrl);
        if (userDocRef) {
          setDocumentNonBlocking(
            userDocRef,
            { profilePicture: downloadUrl },
            { merge: true }
          );
        }

        toast({
          title: 'Profile Picture Updated',
          description: 'Your new picture has been saved.',
        });
      };
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Could not upload your profile picture.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  function onSubmit(values: UserProfile) {
    if (!userDocRef) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Not authenticated. Please log in.',
      });
      return;
    }

    setDocumentNonBlocking(userDocRef, values, { merge: true });

    toast({
      title: 'Profile Updated',
      description: 'Your changes have been saved successfully.',
    });
  }

  return (
    <Card>
      <CardContent className="p-6">
        {(isLoading || !user) && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && user && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={form.watch('profilePicture') || undefined}
                    alt="User avatar"
                  />
                  <AvatarFallback>
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold">Profile Picture</h2>
                  <p className="text-sm text-muted-foreground">
                    Click below to upload a new image.
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handlePictureChangeClick}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Change Picture
                  </Button>
                </div>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us a little about yourself"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || isUploading}
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
