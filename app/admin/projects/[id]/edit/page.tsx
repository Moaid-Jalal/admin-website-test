"use client"


import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Loader2, Star, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { projectsService } from '@/app/service/projectsService';
import { categoriesService } from '@/app/service/categoriesService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { resizeImage } from '../../resizeImage';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string(),
  short_description: z.string(),
  creation_date: z.string(),
  category_id: z.string().min(2, {
    message: "Category is required.",
  }),
  country: z.string().min(2, {
    message: "Country is required.",
  }),
});

interface ProjectImage {
  id: string;
  url: string;
  is_main: boolean;
  display_order: number;
}

interface Project {
  id: string;
  title: string;
  description: string;
  short_description: string;
  category: { id: string; name: string };
  country: string;
  creation_date: string;
  images: Array<{
    id: string;
    url: string;
    is_main: boolean;
    display_order?: number;
  }>;
}

interface ImagePreview {
  file: File;
  preview: string;
  isMain?: boolean;
}

export default function EditProjectPage({ params }: { params: { id: string } }) {
  const projectId = params.id;

  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const { toast } = useToast();
  const [mainImageId, setMainImageId] = useState<string | null>(null);
  const [tempMainImageId, setTempMainImageId] = useState<string | null>(null);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [initialFormValues, setInitialFormValues] = useState<z.infer<typeof formSchema> | null>(null);

  const { data: categories, isLoading: isCategoriesLoading } = categoriesService.useCategories();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      short_description: "",
      category_id: "",
      country: "",
      creation_date: "",
    },
  });

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    if(isLoading) return;

    setIsLoading(true);
    try {
      const res = await projectsService.getProject(projectId);
      setProject(res);

      const formValues = {
        title: res.title,
        description: res.description,
        short_description: res.short_description,
        category_id: res.category?.id || "",
        country: res.country,
        creation_date: res.creation_date,
      };

      setInitialFormValues(formValues);
      form.reset(formValues);


      const  mainImage = res.images.find((img: ProjectImage) => img.is_main);

      if (mainImage) {
        setMainImageId(mainImage.id);
        setTempMainImageId(mainImage.id);
      }

      setIsLoading(false);
    } catch (error) {
      setIsError(true)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch project details",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getChangedFields = (values: z.infer<typeof formSchema>) => {
    if (!initialFormValues) return values;

    const changedFields: Partial<z.infer<typeof formSchema>> = {};
    
    (Object.keys(values) as Array<keyof typeof values>).forEach(key => {
      if (values[key] !== initialFormValues[key]) {
        changedFields[key] = values[key];
      }
    });

    return changedFields;
  };

  
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      const changedFields = getChangedFields(values);

      // Only add changed form values
      Object.entries(changedFields).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Add new images only if there are any
      if (imagePreviews.length > 0) {
        imagePreviews.forEach(preview => {
          formData.append('images', preview.file);
        });
      }

      // Add images to delete only if there are any
      if (imagesToDelete.length > 0) {
        formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
      }

      // Add main image ID only if it changed
      if (tempMainImageId !== mainImageId) {
        formData.append('mainImageId', tempMainImageId || '');
      }

      // Only proceed with the update if there are actual changes
      const hasChanges = 
        Object.keys(changedFields).length > 0 || 
        imagePreviews.length > 0 || 
        imagesToDelete.length > 0 || 
        tempMainImageId !== mainImageId;

      if (hasChanges) {
        formData.forEach((value, key) => {
          console.log(key, value);
        }
      )
        await projectsService.updateProject(projectId, formData);
        toast({
          title: "Success",
          description: "Project updated successfully",
        });

        router.back();
      } else {
        toast({
          title: "Info",
          description: "No changes to save",
        });
        return;
      }
      
      // Navigate back to project details
      // router.back()
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update project",
      });
    } finally {
      setIsSaving(false);
    }
  };


  const handleDeleteImage = (imageId: string) => {
    setImagesToDelete(prev => [...prev, imageId]);
    
    setProject(prev => {
      if (!prev) return null;
      return {
        ...prev,
        images: prev.images.filter(img => img.id !== imageId)
      };
    });

    if (tempMainImageId === imageId) {
      const remainingImages = project?.images.filter(img => img.id !== imageId);
      if (remainingImages?.length) {
        setTempMainImageId(remainingImages[0].id);
      } else {
        setTempMainImageId(null);
      }
    }
  };

  const handleSetMainImage = (imageId: string) => {
    setTempMainImageId(imageId);
  };

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
        });
      } catch (error) {
        console.error("Error resizing image:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to process image",
        });
      }
    }

    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImagePreviews(previews => {
      const newPreviews = [...previews];
      URL.revokeObjectURL(previews[index].preview);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <p className="text-lg text-muted-foreground mb-4">Project not found</p>
        <Button onClick={fetchProject} variant="outline">
          refetch Project
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Project</h1>
      </div>

      <Card className="animate-in fade-in-50 duration-300">
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Project title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isCategoriesLoading}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Input placeholder="Project country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="creation_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Creation date</FormLabel>
                      <FormControl>
                        <Input placeholder="2024, 2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="short_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Short description"
                        className="min-h-[50px]"
                        {...field}
                      />
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
                      <Textarea 
                        placeholder="Project description"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {project && project.images.length > 0 && (
                <div className="space-y-2">
                  <FormLabel>Current Images</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                    {project.images.map((image) => (
                      <div key={image.id} className="relative group border rounded-lg p-1 overflow-hidden transition-all hover:shadow-md">
                        <div className="aspect-square relative">
                          <Image
                            src={image.url}
                            alt="Project"
                            fill
                            priority
                            quality={80}
                            sizes="(max-width: 640px) 40vw, (max-width: 768px) 30vw, 20vw"
                            className={`object-cover rounded-lg transition-all ${image.id === tempMainImageId ? 'ring-2 ring-primary' : ''}`}
                          />
                        </div>
                        {image.id === tempMainImageId && (
                          <span className="absolute top-2 left-2 bg-white rounded-full p-1 shadow">
                            <Star className="h-5 w-5 text-yellow-500" />
                          </span>
                        )}
                        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteImage(image.id)}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          {image.id !== tempMainImageId && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              onClick={() => handleSetMainImage(image.id)}
                              title="Set as main image"
                              className="h-8 w-8"
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

              <div className="space-y-2">
                <FormLabel>Add New Images</FormLabel>
                <div className="mt-2">
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
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
                            className="absolute inset-0 w-full h-full object-cover rounded-lg transition-all"
                          />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="min-w-[120px]">
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
