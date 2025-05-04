"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mutate } from 'swr';
import { API_BASE_URL } from '@/app/config/apiUrl';
import { IconSearch } from '@/components/iconSearch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { languagesService } from '@/app/service/languagesService';
import { categoriesService } from '@/app/service/categoriesService';
import Image from 'next/image';
import Link from 'next/link';

const translationSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().optional(),
});

export default function NewCategoryPage() {
  const { languages, isLoading: isLanguagesLoading } = languagesService.useLanguages();

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [selectedIcon, setSelectedIcon] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>('');

  const formSchema = z.object({
    icon_svg_url: z.string().min(2, { message: "Icon URL is required." }),
    translations: z.record(translationSchema).refine(
      translations => Object.keys(translations).length === (languages?.length || 0),
      { message: "Translations for all languages are required" }
    )
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      icon_svg_url: "",
      translations: {}
    }
  });

  useEffect(() => {
    if (languages && languages.length > 0) {
      const defaultTranslations = languages.reduce((acc, lang) => ({
        ...acc,
        [lang.code]: {
          name: "",
          description: "",
        }
      }), {});

      form.reset({
        icon_svg_url: "",
        translations: defaultTranslations
      });

      setActiveTab(languages[0].code);
    }
  }, [languages, form]);

  const handleIconSelect = (url: string) => {
    setSelectedIcon(url);
    form.setValue("icon_svg_url", url, { shouldValidate: true });
  };

  const handleRemoveIcon = () => {
    setSelectedIcon(undefined);
    form.setValue("icon_svg_url", "", { shouldValidate: true });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const cleanTranslations = Object.fromEntries(
        Object.entries(values.translations).map(([code, t]) => [
          code,
          { name: t.name, description: t.description }
        ])
      );
      const payload = {
        icon_svg_url: values.icon_svg_url,
        translations: cleanTranslations
      };

      const response = await categoriesService.createCategory(payload);

      await mutate(`${API_BASE_URL}/categories`);

      toast({
        title: "Success",
        description: "Category created successfully",
        variant: "default",
      });

      router.push('/admin/our-sectors/categories');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create category",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLanguagesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 container mx-auto px-4 py-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/our-sectors/categories`}>
          <Button variant="ghost" className="shrink-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">New Category</h1>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-xl">Category Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="icon_svg_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Icon</FormLabel>
                        <IconSearch onSelect={handleIconSelect} />
                        {field.value && (
                          <div className="mt-4 flex items-start gap-3">
                            <div className="flex-shrink-0 relative">
                              <Image
                                src={`${field.value}?color=white`} 
                                alt="Selected Icon" 
                                width={48} 
                                height={48}
                                className="p-1 rounded-md bg-muted"
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                onClick={handleRemoveIcon}
                                className="h-6 w-6 absolute -top-2 -right-2"
                                title="Remove icon"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-muted-foreground break-all line-clamp-2">
                                {field.value}
                              </p>
                            </div>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-24 h-24 rounded-lg bg-background border flex items-center justify-center">
                        {form.watch("icon_svg_url") ? (
                          <Image
                            src={`${form.watch("icon_svg_url")}?color=white`}
                            alt="Preview Icon"
                            width={64}
                            height={64}
                            className="object-contain p-2"
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm text-center">No Icon Selected</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Icon Preview
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {languages && languages.length > 0 ? (
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="w-full grid grid-cols-3">
                        {languages.map((lang) => (
                          <TabsTrigger 
                            key={lang.code} 
                            value={lang.code}
                            disabled={isSubmitting}
                          >
                            <span className="flex items-center gap-2">
                              <Image
                                src={`https://api.iconify.design/circle-flags:lang-${lang.code}.svg`}
                                alt={lang.name}
                                width={18}
                                height={18}
                                className="rounded-full"
                              />                              {lang.name}
                              </span>
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {languages.map((lang) => (
                        <TabsContent key={lang.code} value={lang.code} className="space-y-4 pt-4">
                          <FormField
                            control={form.control}
                            name={`translations.${lang.code}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder={`Enter ${lang.name} name`} 
                                    {...field} 
                                    disabled={isSubmitting}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`translations.${lang.code}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder={`Enter ${lang.name} description`} 
                                    {...field} 
                                    value={field.value || ''}
                                    disabled={isSubmitting}
                                    rows={4}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="border rounded-lg p-4 bg-muted/50">
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline" className="text-xs font-medium">
                                {lang.name} Preview
                              </Badge>
                              <Image
                                src={`https://api.iconify.design/circle-flags:lang-${lang.code}.svg`}
                                alt={lang.name}
                                width={18}
                                height={18}
                                className="rounded-full"
                              />
                            </div>
                            <Card className="overflow-hidden">
                              <div className="aspect-[16/9] relative flex items-center justify-center">
                                {form.watch("icon_svg_url") && (
                                  <Image
                                    src={`${form.watch("icon_svg_url")}?color=white`}
                                    alt={form.watch(`translations.${lang.code}.name`) || lang.name}
                                    width={120}
                                    height={120}
                                    style={{ objectFit: "contain" }}
                                  />
                                )}
                              </div>
                              <CardHeader>
                                <CardTitle className='text-center'>
                                  {form.watch(`translations.${lang.code}.name`) || `[${lang.name} Name]`}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-muted-foreground text-center">
                                  {form.watch(`translations.${lang.code}.description`) || `[${lang.name} description will appear here]`}
                                </p>
                              </CardContent>
                              <CardFooter />
                            </Card>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-muted-foreground">No languages available</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || isLanguagesLoading}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Creating..." : "Create Category"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}