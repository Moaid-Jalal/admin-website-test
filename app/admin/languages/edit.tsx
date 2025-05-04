"use client"

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { mutate } from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { languagesService } from "@/app/service/languagesService";
import { API_BASE_URL } from '@/app/config/apiUrl';

interface EditLanguagePageProps {
    id: string;
    onClose: () => void;
}

const formSchema = z.object({
    code: z.string().min(2, { message: "Code is required (e.g. ar, en, fr)" }),
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

export const EditLanguagePage = ({
    id,
    onClose
}: EditLanguagePageProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const { languages } = languagesService.useLanguages();
    const language = languages?.find((l: any) => l.id === id);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            code: language?.code || "",
            name: language?.name || "",
        },
    });

    // Reset form when language data is loaded or changes
    useEffect(() => {
        if (language) {
            form.reset({
                code: language.code,
                name: language.name,
            });
        }
    }, [language, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const updated = await languagesService.updateLanguage(id, values);

            // Update the cache with the new data
            mutate(
                `${API_BASE_URL}/languages`,
                (prev: any[] = []) => prev.map((l) => (l.id === id ? updated : l)),
                false
            );

            toast({
                title: "Success",
                description: "Language updated successfully.",
            });
            onClose();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
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

    if (!language) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <span className="text-muted-foreground">Language not found.</span>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-[80vh] w-[70vh]">
            <Card className="w-full max-w-xl shadow-lg">
                <CardHeader>
                    <CardTitle className="text-center">Edit Language</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Code</FormLabel>
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
                                            <Input placeholder="Language name" {...field} />
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
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}