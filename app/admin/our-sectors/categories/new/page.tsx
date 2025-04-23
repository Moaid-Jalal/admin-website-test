"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { categoriesService } from '@/app/service/categoriesService';
import { useToast } from '@/hooks/use-toast';

import { mutate } from 'swr';
import { API_BASE_URL } from '@/app/config/apiUrl';
import { IconSearch } from '@/components/iconSearch';

const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    description: z.string().optional(),
    icon_svg_url: z.string().min(2, { message: "Icon URL is required." }),
});



export default function NewCategoryPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const [selectedIcon, setSelectedIcon] = useState<string | undefined>(undefined);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            icon_svg_url: "",
        },
    });

    const handleIconSelect = (url: string) => {
        setSelectedIcon(url);
        form.setValue("icon_svg_url", url);
    };

    const handleRemoveIcon = () => {
      form.setValue("icon_svg_url", "");
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const res = await categoriesService.createCategory(values);

            const newCategory = {
                id: res.id,
                name: values.name,
                description: values.description,
                icon_svg_url: values.icon_svg_url,
                project_count: 0,
                created_at: new Date().toISOString(),
            };

            mutate(
                `${API_BASE_URL}/categories`,
                (prev: any) => Array.isArray(prev) ? [newCategory, ...prev] : [newCategory],
                false
            );

            router.back();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create category",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Categories
                </Button>
                <h1 className="text-3xl font-bold">New Category</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Category Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Category description" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="icon_svg_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category Icon (SVG)</FormLabel>
                                        <IconSearch onSelect={handleIconSelect} />
                                        {field.value && (
                                          <div className="mt-2 flex items-center gap-2">
                                            <img src={`${field.value}?color=white`} alt="Selected Icon" width={48} height={48} />
                                            <Button
                                              type="button"
                                              size="icon"
                                              variant="destructive"
                                              onClick={handleRemoveIcon}
                                              className="h-8 w-8"
                                              title="Remove icon"
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                            <span className="text-xs text-muted-foreground break-all">{field.value}</span>
                                          </div>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="mt-8">
                                <div className="flex flex-col items-center justify-center border rounded-xl bg-muted py-8 px-4 max-w-xs mx-auto shadow">
                                    <div className="mb-4 flex items-center justify-center w-28 h-28 rounded-full  border">
                                        {form.watch("icon_svg_url") ? (
                                            <img
                                                src={`${form.watch("icon_svg_url")}?color=white`}  // إضافة color=white
                                                alt="Preview Icon"
                                                width={80}
                                                height={80}
                                                style={{ objectFit: "contain" }}
                                            />
                                        ) : (
                                            <span className="text-muted-foreground">No Icon</span>
                                        )}
                                    </div>
                                    <div className="text-xl font-bold mb-1 text-center">
                                        {form.watch("name") || "Category Name"}
                                    </div>
                                    <div className="text-muted-foreground text-center">
                                        {form.watch("description") || "Category description will appear here."}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Category
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
