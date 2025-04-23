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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { ArrowLeft, Loader2, Star, StarOff, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { projectsService } from '@/app/service/projectsService';
import { resizeImage } from '@/app/admin/projects/resizeImage';
import { categoriesService } from '@/app/service/categoriesService';

import { mutate } from 'swr';
import { API_BASE_URL } from '@/app/config/apiUrl';


const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  short_description: z.string(),
  creation_date: z.string().min(4, {
    message: "Creation date is required.",
  }),
  category_id: z.string().min(2, {
    message: "Category is required.",
  }),
  country: z.string().min(2, {
    message: "country is required.",
  }),
});

interface ImagePreview {
  file: File;
  preview: string;
  isMain: boolean;
}

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const { data: categories, isLoading: isCategoriesLoading } = categoriesService.useCategories();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      short_description: "",
      creation_date: "",
      country: "",
      category_id: "",
    },
  });


  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
  
    const newPreviews: ImagePreview[] = [];
  
    for (const file of Array.from(files)) {
      try {
        // ضغط الصورة باستخدام resizeImage
        const resizedFile = await resizeImage(file, 800, 800); // تحديد الأبعاد والحد الأقصى
  
        // إضافة المعاينة للصورة المضغوطة
        newPreviews.push({
          file: resizedFile,
          preview: URL.createObjectURL(resizedFile),
          isMain: false
        });
      } catch (error) {
        console.error("Error resizing image:", error);
      }
    }
  
    // إذا كانت الصورة الأولى يتم إضافتها، اجعلها الصورة الرئيسية
    if (imagePreviews.length === 0 && newPreviews.length > 0) {
      newPreviews[0].isMain = true;
    }
  
    // تحديث المعاينات
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
      // If we removed the main image and there are other images, make the first one main
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

      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Find the index of the main image
      const mainImageIndex = imagePreviews.findIndex(preview => preview.isMain);
      formData.append('mainImageIndex', mainImageIndex.toString());

      imagePreviews.forEach(preview => {
        formData.append('images', preview.file);
      });

      await projectsService.createProject(formData)

      toast({
        title: "Success",
        description: "Project created successfully",
      });

      router.back();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost"  onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <h1 className="text-3xl font-bold">New Project</h1>
      </div>

      <Card>
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
                      <div className="relative">
                      <Select onValueChange={field.onChange} value={field.value}>
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
                      </div>
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
                      <FormLabel>country</FormLabel>
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
                    <FormLabel>Description (optional)</FormLabel>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/projects')}
                >
                  Cancel
                </Button>
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