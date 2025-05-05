"use client"

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, Star, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { projectsService } from '@/app/service/projectsService';
import { resizeImage } from '@/app/admin/projects/resizeImage';
import { categoriesService } from '@/app/service/categoriesService';
import { languagesService } from '@/app/service/languagesService';
import Link from "next/link";
import { debounce } from 'lodash';

// Type Definitions
type TranslationValues = {
  title: string;
  short_description: string;
  extra_description?: string;
};

type ImagePreview = {
  file: File;
  preview: string;
  isMain: boolean;
};

type ProjectFormValues = {
  category_id: string;
  translations: Record<string, TranslationValues>;
  creation_date?: string;
  country?: string;
};

type ProjectImage = {
  id: string;
  url: string;
  is_main: boolean;
};

type ProjectData = {
  id: string;
  category_id: string;
  category: {
    slug: string;
  };
  creation_date?: string;
  country?: string;
  images: ProjectImage[];
  translations?: Record<string, Partial<TranslationValues>>;
};

// Validation Schemas
const translationSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  short_description: z.string().min(5, { message: "Short description must be at least 5 characters." }),
  extra_description: z.string().optional(),
});

const formSchema = z.object({
  category_id: z.string().min(1, { message: "Category is required." }),
  translations: z.record(translationSchema).refine(
    translations => Object.keys(translations).length > 0,
    { message: "At least one language translation is required" }
  ),
  creation_date: z.string().optional(),
  country: z.string().max(50, { message: "Country name too long" }).optional(),
});

export default function EditProjectPage({ params }: { params: { id: string, slug: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Data fetching
  const { data: categories, isLoading: isCategoriesLoading } = categoriesService.useCategories();
  const { languages, isLoading: isLanguagesLoading } = languagesService.useLanguages();
  
  // State management
  const [activeTab, setActiveTab] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [mainImageId, setMainImageId] = useState<string | null>(null);
  const [tempMainImageId, setTempMainImageId] = useState<string | null>(null);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [initialFormValues, setInitialFormValues] = useState<ProjectFormValues | null>(null);

  // Form initialization
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category_id: "",
      translations: {},
      creation_date: "",
      country: "",
    },
    mode: "onBlur",
  });

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!params.id || !languages) return;

      setIsLoading(true);
      try {
        const res = await projectsService.getProject(params.id);
        setProject(res);

        // Initialize translations with all languages
        const translations = languages.reduce((acc, lang) => {
          const langData = res.translations?.[lang.code] || {};
          return {
            ...acc,
            [lang.code]: {
              title: langData.title || "",
              short_description: langData.short_description || "",
              extra_description: langData.extra_description || "",
            }
          };
        }, {} as Record<string, TranslationValues>);

        const formValues: ProjectFormValues = {
          category_id: res.category_id,
          translations,
          creation_date: res.creation_date || "",
          country: res.country || "",
        };

        form.reset(formValues);
        setInitialFormValues(JSON.parse(JSON.stringify(formValues)));

        // Set main image
        if (res.images?.length > 0) {
          const mainImg = res.images.find((img: any) => img.is_main);
          setMainImageId(mainImg?.id || null);
          setTempMainImageId(mainImg?.id || null);
        }

      } catch (error) {
        console.error("Fetch project error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch project details",
        });
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [params.id]);

  // Set default tab to first language
  useEffect(() => {
    if (languages && languages.length > 0 && !activeTab) {
      setActiveTab(languages[0].code);
    }
  }, [languages, activeTab]);

  // Handle image uploads
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPreviews: ImagePreview[] = [];
    
    try {
      for (const file of Array.from(files)) {
        const resizedFile = await resizeImage(file, 800, 800);
        newPreviews.push({
          file: resizedFile,
          preview: URL.createObjectURL(resizedFile),
          isMain: imagePreviews.length === 0 && newPreviews.length === 0 // First image is main by default
        });
      }

      setImagePreviews(prev => [...prev, ...newPreviews]);
    } catch (error) {
      console.error("Error processing images:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process some images",
      });
    }
  };

  // Image management functions
  const toggleMainImage = (index: number) => {
    setImagePreviews(prev => prev.map((img, i) => ({
      ...img,
      isMain: i === index
    })));
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      const removed = newPreviews.splice(index, 1);
      
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(removed[0].preview);
      
      // If we removed the main image, set the first remaining as main
      if (removed[0].isMain && newPreviews.length > 0) {
        newPreviews[0].isMain = true;
      }
      
      return newPreviews;
    });
  };

  const handleDeleteImage = (imageId: string) => {
    setImagesToDelete(prev => [...prev, imageId]);
    
    // Update project images in state
    setProject(prev => {
      if (!prev) return null;
      
      const updatedImages = prev.images.filter(img => img.id !== imageId);
      
      // If we deleted the main image, set a new main image
      if (tempMainImageId === imageId) {
        setTempMainImageId(updatedImages[0]?.id || null);
      }
      
      return {
        ...prev,
        images: updatedImages
      };
    });
  };

  const handleSetMainImage = (imageId: string) => {
    setTempMainImageId(imageId);
  };

  // Optimized form updates with debouncing
  const debouncedUpdate = useMemo(() => 
    debounce((field: string, value: string) => {
      form.setValue(field as any, value, { shouldDirty: true });
    }, 500),
    [form]
  );

  // Determine which fields have changed
  const getChangedFields = useCallback((values: ProjectFormValues) => {
    if (!initialFormValues) return values;

    const changedFields: Partial<ProjectFormValues> = {};
    const keys = Object.keys(values) as (keyof ProjectFormValues)[];

    keys.forEach(key => {
      if (key === "translations") {
        const changedTranslations: Record<string, TranslationValues> = {};
        
        Object.entries(values.translations).forEach(([lang, currentLang]) => {
          const initialLang = initialFormValues.translations[lang] || {};
          const changedFields: Partial<TranslationValues> = {};
          
          // Check each translation field for changes
          (Object.keys(currentLang) as (keyof TranslationValues)[]).forEach(field => {
            if (currentLang[field] !== initialLang[field]) {
              changedFields[field] = currentLang[field];
            }
          });
          
          // Only include if there are changes
          if (Object.keys(changedFields).length > 0) {
            changedTranslations[lang] = {
              title: changedFields.title ?? initialLang.title ?? "",
              short_description: changedFields.short_description ?? initialLang.short_description ?? "",
              extra_description: changedFields.extra_description ?? initialLang.extra_description ?? "",
            };
          }
        });
        
        if (Object.keys(changedTranslations).length > 0) {
          changedFields.translations = changedTranslations;
        }
      } else if (JSON.stringify(values[key]) !== JSON.stringify(initialFormValues[key])) {
        changedFields[key] = values[key];
      }
    });

    return changedFields;
  }, [initialFormValues]);

  // Form submission handler
  const onSubmit = async (values: ProjectFormValues) => {
    if (!project) return;
    
    setIsSaving(true);
    
    try {
      const formData = new FormData();
      const changedFields = getChangedFields(values);

      // Append changed fields to form data
      Object.entries(changedFields).forEach(([key, value]) => {
        if (key === "translations") {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Append new images
      imagePreviews.forEach((preview, index) => {
        formData.append('images', preview.file);
        if (preview.isMain) {
          formData.append('mainImageIndex', index.toString());
        }
      });

      // Append images to delete
      if (imagesToDelete.length > 0) {
        formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
      }

      // Append main image change if different
      if (tempMainImageId !== mainImageId) {
        formData.append('mainImageId', tempMainImageId || '');
      }

      // Check if there are actual changes
      const hasChanges = (
        Object.keys(changedFields).length > 0 ||
        imagePreviews.length > 0 ||
        imagesToDelete.length > 0 ||
        tempMainImageId !== mainImageId
      );

      if (!hasChanges) {
        toast({
          title: "No Changes",
          description: "No changes were made to save",
        });
        return;
      }

      // Perform the update
      await projectsService.updateProject(params.id, formData);

      toast({
        title: "Success",
        description: "Project updated successfully",
      });

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/admin/our-sectors/categories/${params.slug}/projects`);
      }, 1000);
      
    } catch (error: any) {
      console.error("Update error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update project",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading || isLanguagesLoading || isCategoriesLoading || !project) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/our-sectors/categories/${params.slug}/projects`}>
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Project</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Category Selection */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <FormControl>
                      <select
                        className="w-full border rounded px-3 py-2 bg-background"
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSaving}
                      >
                        <option value="">Select category</option>
                        {categories?.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date and Country */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="creation_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Creation Year</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. 2024" 
                          {...field} 
                          disabled={isSaving}
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
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Country" 
                          {...field} 
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Language Tabs */}
              {languages && languages.length > 0 && (
                <Tabs 
                  value={activeTab} 
                  onValueChange={setActiveTab} 
                  defaultValue={languages[0]?.code}
                  className="w-full"
                >
                  <TabsList className="w-full grid grid-cols-3">
                    {languages.map((lang) => (
                      <TabsTrigger 
                        key={lang.code} 
                        value={lang.code}
                        disabled={isSaving}
                      >
                        <span className="flex items-center gap-2">
                          <Image
                            src={`https://api.iconify.design/circle-flags:${lang.code}.svg`}
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
                      {/* Title */}
                      <FormField
                        control={form.control}
                        name={`translations.${lang.code}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={`Title in ${lang.name}`}
                                defaultValue={field.value}
                                onChange={(e) => {
                                  field.onChange(e);
                                  debouncedUpdate(`translations.${lang.code}.title`, e.target.value);
                                }}
                                onBlur={field.onBlur}
                                disabled={isSaving}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Short Description */}
                      <FormField
                        control={form.control}
                        name={`translations.${lang.code}.short_description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Short Description *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={`Short description in ${lang.name}`}
                                {...field}
                                disabled={isSaving}
                                rows={3}
                                onChange={(e) => {
                                  field.onChange(e);
                                  debouncedUpdate(`translations.${lang.code}.short_description`, e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Extra Description */}
                      <FormField
                        control={form.control}
                        name={`translations.${lang.code}.extra_description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Extra Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={`Extra details in ${lang.name}`}
                                {...field}
                                disabled={isSaving}
                                rows={5}
                                onChange={(e) => {
                                  field.onChange(e);
                                  debouncedUpdate(`translations.${lang.code}.extra_description`, e.target.value);
                                }}
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

              {/* Current Images */}
              {project.images.length > 0 && (
                <div className="space-y-2">
                  <FormLabel>Current Images</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                    {project.images
                      .filter(img => !imagesToDelete.includes(img.id))
                      .map((image) => (
                        <div 
                          key={image.id} 
                          className="relative group border rounded-lg p-1 overflow-hidden transition-all hover:shadow-md"
                        >
                          <div className="aspect-square relative">
                            <Image
                              src={image.url}
                              alt="Project image"
                              fill
                              className={`object-cover rounded-lg ${image.id === tempMainImageId ? 'ring-2 ring-primary' : ''}`}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          </div>
                          
                          {image.id === tempMainImageId && (
                            <span className="absolute top-2 left-2 bg-white rounded-full p-1 shadow">
                              <Star className="h-4 w-4 text-yellow-500" />
                            </span>
                          )}
                          
                          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteImage(image.id)}
                              disabled={isSaving}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            
                            {image.id !== tempMainImageId && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleSetMainImage(image.id)}
                                disabled={isSaving}
                                title="Set as main image"
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* New Images Upload */}
              <div className="space-y-2">
                <FormLabel>Add New Images</FormLabel>
                <div className="mt-2">
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                    disabled={isSaving}
                  />
                </div>
                
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group border rounded-lg p-1 overflow-hidden">
                        <div className="aspect-square relative">
                          <img
                            src={preview.preview}
                            alt={`Preview ${index + 1}`}
                            className="absolute inset-0 w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                            disabled={isSaving}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            type="button"
                            variant={preview.isMain ? "default" : "secondary"}
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => toggleMainImage(index)}
                            disabled={isSaving}
                            title={preview.isMain ? "Main image" : "Set as main image"}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                
                <Button 
                  type="submit" 
                  disabled={isSaving || !form.formState.isDirty} 
                  className="min-w-[120px]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}