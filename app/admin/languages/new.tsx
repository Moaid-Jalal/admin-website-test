"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/app/config/apiUrl';
import { mutate } from 'swr';
import { languagesService } from "@/app/service/languagesService";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';


const formSchema = z.object({
  code: z.string().min(2, { message: "Code is required (e.g. ar, en, fr)" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

interface NewLanguagePageProps {
    onClose: () => void;
}

export const NewLanguagePage = ({
    onClose
}: NewLanguagePageProps) => {

    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
            defaultValues: {
            code: "",
            name: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if(isLoading) return;

        setIsLoading(true);

        try {
            const created = await languagesService.createLanguage(values);
            mutate(
                `${API_BASE_URL}/languages`,
                (prev: any[] = []) => [created, ...prev],
                false
            );
            toast({
                title: "Success",
                description: "Language added successfully.",
            });

            onClose()
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add language",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
    
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    return (
        <div className="flex items-center justify-center min-h-[150vh] w-[70vh]">
            <Card className="w-full max-w-xl shadow-lg">
                <CardHeader>
                    <CardTitle className="text-center">Add New Language</CardTitle>
                </CardHeader>
                <CardContent>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="en, ar, tr, etc." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />


                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Category name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />


                            <div className="flex justify-end gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    save language
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
