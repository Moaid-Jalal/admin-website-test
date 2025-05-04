"use client"

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, Star, StarOff, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { projectsService } from '@/app/service/projectsService';
import { resizeImage } from '@/app/admin/projects/resizeImage';
import { categoriesService } from '@/app/service/categoriesService';
import { languagesService } from '@/app/service/languagesService';
import Link from 'next/link';

const translationSchema = z.object({
  title: z.string().min(2, { message: "Title is required." }),
  short_description: z.string().min(2, { message: "Short description is required." }),
  extra_description: z.string().optional(),
});

const formSchema = z.object({
  category_id: z.string().min(2, { message: "Category is required." }),
  translations: z.record(translationSchema).refine(
    translations => Object.keys(translations).length > 0,
    { message: "Translations for all languages are required" }
  ),
  creation_date: z.string().optional(),
  country: z.string().optional(),
});

interface ImagePreview {
  file: File;
  preview: string;
  isMain: boolean;
}

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const { data: categories, isLoading: isCategoriesLoading } = categoriesService.useCategories();
  const { languages, isLoading: isLanguagesLoading } = languagesService.useLanguages();
  const categorySlugFromQuery = searchParams?.get("category");
  const { refetch } = projectsService.useCategoryProjects(categories?.find(cat => cat.slug === categorySlugFromQuery)?.id || "");
  const [activeTab, setActiveTab] = useState<string>("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category_id: "",
      translations: {},
      creation_date: "",
      country: "",
    },
  });

  useEffect(() => {
    if (
      languages &&
      languages.length > 0 &&
      categories &&
      categories.length > 0 &&
      form.getValues("category_id") === "" // فقط إذا لم يتم تعبئة النموذج بعد
    ) {
      const defaultTranslations = languages.reduce((acc, lang) => ({
        ...acc,
        [lang.code]: {
          title: "",
          short_description: "",
          extra_description: "",
        }
      }), {});
      let initialCategoryId = "";
      if (categorySlugFromQuery && categories.some(cat => cat.slug === categorySlugFromQuery)) {
        initialCategoryId = categories.find(cat => cat.slug === categorySlugFromQuery)?.id || "";
      }
      form.reset({
        category_id: initialCategoryId,
        translations: defaultTranslations,
        creation_date: "",
        country: "",
      });
      setActiveTab(languages[0].code);
    }
    // eslint-disable-next-line
  }, [languages, categories, searchParams]); // احذف form من dependencies

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPreviews: ImagePreview[] = [];

    for (const file of Array.from(files)) {
      try {
        const resizedFile = await resizeImage(file, 800, 800);

        newPreviews.push({
          file: resizedFile,
          preview: URL.createObjectURL(resizedFile),
          isMain: false
        });
      } catch (error) {
        console.error("Error resizing image:", error);
      }
    }

    if (imagePreviews.length === 0 && newPreviews.length > 0) {
      newPreviews[0].isMain = true;
    }

    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const toggleMainImage = (index: number) => {
    setImagePreviews(previews => 
      previews.map((preview, i) => ({
        ...preview,
        isMain: i === index
      }))
    );
  };

  const removeImage = (index: number) => {
    setImagePreviews(previews => {
      const newPreviews = previews.filter((_, i) => i !== index);
      if (previews[index].isMain && newPreviews.length > 0) {
        newPreviews[0].isMain = true;
      }
      return newPreviews;
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (imagePreviews.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one image",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("category_id", values.category_id);
      formData.append("translations", JSON.stringify(values.translations));
      if (values.creation_date) formData.append("creation_date", values.creation_date);
      if (values.country) formData.append("country", values.country);

      const mainImageIndex = imagePreviews.findIndex(preview => preview.isMain);
      formData.append('mainImageIndex', mainImageIndex.toString());
      imagePreviews.forEach(preview => {
        formData.append('images', preview.file);
      });

      formData.forEach((value, key) => {
        console.log(key, value);
      })

      await projectsService.createProject(formData);

      await refetch();

      toast({
        title: "Success",
        description: "Project created successfully",
      });

      router.push(`/admin/our-sectors/categories/${categories?.find(cat => cat.id === values.category_id)?.slug}/projects`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isLanguagesLoading || isCategoriesLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/our-sectors/categories/${categories?.find(cat => cat.id === form.getValues("category_id"))?.slug}/projects`}>
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">New Project</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <select
                          className="w-full border rounded px-3 py-2 bg-background"
                          value={field.value}
                          onChange={e => field.onChange(e.target.value)}
                        >
                          <option value="">Select category</option>
                          {categories?.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.icon_svg_url && (
                                <span>
                                  <Image
                                    src={cat.icon_svg_url}
                                    alt={cat.name}
                                    width={18}
                                    height={18}
                                    className="inline-block mr-2"
                                  />
                                </span>
                              )}
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="creation_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Creation Year (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 2024"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Country"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {languages && languages.length > 0 && (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full grid grid-cols-3">
                    {languages.map((lang) => (
                      <TabsTrigger key={lang.code} value={lang.code}>
                        <span className="flex items-center gap-2">
                            <Image
                              src={`https://api.iconify.design/circle-flags:lang-${lang.code}.svg`}
                              alt={lang.name}
                              width={18}
                              height={18}
                              className="rounded-full"
                            />
                          {lang.name}
                        </span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {languages.map((lang) => (
                    <TabsContent key={lang.code} value={lang.code} className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name={`translations.${lang.code}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={`Enter ${lang.name} title`}
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`translations.${lang.code}.short_description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Short Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={`Enter ${lang.name} short description`}
                                {...field}
                                disabled={isLoading}
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`translations.${lang.code}.extra_description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Extra Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={`Enter ${lang.name} extra description`}
                                {...field}
                                disabled={isLoading}
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              )}

              <div>
                <FormLabel>Project Images</FormLabel>
                <div className="mt-2">
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => toggleMainImage(index)}
                          >
                            {preview.isMain ? (
                              <Star className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {preview.isMain && (
                          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                            Main Image
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4">
                <Link href={`/admin/our-sectors/categories/${categories?.find(cat => cat.id === form.getValues("category_id"))?.slug}/projects`}>
                  <Button
                    type="button"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Project
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}