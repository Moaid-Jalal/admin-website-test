"use client"

import { useEffect, useState } from 'react';
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
import { ArrowLeft, Loader2, Star, StarOff, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { projectsService } from '@/app/service/projectsService';
import { resizeImage } from '@/app/admin/projects/resizeImage';
import { categoriesService } from '@/app/service/categoriesService';
import { languagesService } from '@/app/service/languagesService';
import { useSWRConfig } from "swr";
import Link from "next/link";

// 1. تحسين تعريفات الأنواع
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

// 2. تحسين تعريفات السكيما
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

export default function EditProjectPage({ params }: { params: { id: string, slug: string } }) {
    const router = useRouter();
    const { toast } = useToast();
    const { data: categories, isLoading: isCategoriesLoading } = categoriesService.useCategories();
    const { languages, isLoading: isLanguagesLoading } = languagesService.useLanguages();

    // 3. تحسين إدارة الحالة
    const [activeTab, setActiveTab] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
    const [mainImageId, setMainImageId] = useState<string | null>(null);
    const [tempMainImageId, setTempMainImageId] = useState<string | null>(null);
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
    const [project, setProject] = useState<any>(null);
    const [initialFormValues, setInitialFormValues] = useState<ProjectFormValues | null>(null);

    // 4. تحسين تهيئة النموذج
    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            category_id: "",
            translations: {},
            creation_date: "",
            country: "",
        },
    });

    useEffect(() => {
        fetchProject();
    }, [params.id]);

    // 5. تحسين جلب بيانات المشروع
    const fetchProject = async () => {
        setIsLoading(true);
        try {
            const res = await projectsService.getProject(params.id);
            setProject(res);

            const translations = languages?.reduce((acc, lang) => ({
                ...acc,
                [lang.code]: {
                    title: res.translations?.[lang.code]?.title || res.title || "",
                    short_description: res.translations?.[lang.code]?.short_description || res.short_description || "",
                    extra_description: res.translations?.[lang.code]?.extra_description || res.extra_description || "",
                }
            }), {} as Record<string, TranslationValues>) || {};

            const formValues: ProjectFormValues = {
                category_id: res.category_id || "",
                translations,
                creation_date: res.creation_date || "",
                country: res.country || "",
            };

            form.reset(formValues);
            setInitialFormValues(formValues);

            // إدارة الصور
            if (res.images?.length > 0) {
                const mainImg = res.images.find((img: any) => img.is_main);
                setMainImageId(mainImg?.id || null);
                setTempMainImageId(mainImg?.id || null);
            }

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch project details",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 6. تحسين معالجة الصور
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        let newPreviews: ImagePreview[] = [];
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
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };

    const toggleMainImage = (index: number) => {
        setImagePreviews(prev => prev.map((img, i) => ({
            ...img,
            isMain: i === index
        })));
    };

    const removeImage = (index: number) => {
        setImagePreviews(prev => {
            const newPreviews = prev.filter((_, i) => i !== index);
            if (prev[index].isMain && newPreviews.length > 0) {
                newPreviews[0].isMain = true;
            }
            return newPreviews;
        });
    };

    const handleDeleteImage = (imageId: string) => {
        setImagesToDelete(prev => [...prev, imageId]);
        setProject((prev: any) => ({
            ...prev,
            images: prev?.images?.filter((img: any) => img.id !== imageId) || []
        }));
        
        if (tempMainImageId === imageId) {
            const remainingImages = project?.images?.filter((img: any) => img.id !== imageId) || [];
            setTempMainImageId(remainingImages[0]?.id || null);
        }
    };

    const handleSetMainImage = (imageId: string) => {
        setTempMainImageId(imageId);
    };

    // 7. تحسين اكتشاف الحقول المتغيرة
    const getChangedFields = (values: ProjectFormValues) => {
        if (!initialFormValues) return values;

        const changedFields: Partial<ProjectFormValues> = {};
        const keys = Object.keys(values) as (keyof ProjectFormValues)[];

        keys.forEach(key => {
            if (key === "translations") {
                const changedTranslations: Record<string, TranslationValues> = {}; // جعلها إلزامية
                Object.entries(values.translations).forEach(([lang, currentLang]) => {
                  const initialLang = initialFormValues.translations?.[lang] || { title: "", description: "" }; // التأكد من أن الحقول غير فارغة
                  const changedLangFields: Partial<TranslationValues> = {};
                  (Object.keys(currentLang) as (keyof TranslationValues)[]).forEach(fieldKey => {
                    if (currentLang[fieldKey] !== initialLang[fieldKey]) {
                      changedLangFields[fieldKey] = currentLang[fieldKey];
                    }
                  });
                  if (Object.keys(changedLangFields).length > 0) {
                    changedTranslations[lang] = changedLangFields as TranslationValues; // تحويل إلى النوع المطلوب
                  }
                });
                if (Object.keys(changedTranslations).length > 0) {
                  changedFields.translations = changedTranslations;
                }
            } else if (values[key] !== initialFormValues[key]) {
                changedFields[key] = values[key];
            }
        });

        return changedFields;
    };

    // 8. تحسين نظام Submit
    async function onSubmit(values: ProjectFormValues) {
        setIsSaving(true);
        try {
            const formData = new FormData();
            const changedFields = getChangedFields(values);

            // إضافة الحقول المتغيرة فقط
            Object.entries(changedFields).forEach(([key, value]) => {
                if (key === "translations") {
                    formData.append(key, JSON.stringify(value));
                } else if (value !== undefined) {
                    formData.append(key, value as string);
                }
            });

            // إضافة الصور الجديدة
            imagePreviews.forEach(preview => {
                formData.append('images', preview.file);
            });

            // إضافة الصور للحذف
            if (imagesToDelete.length > 0) {
                formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
            }

            // تحديث الصورة الرئيسية إذا تغيرت
            if (tempMainImageId !== mainImageId) {
                formData.append('mainImageId', tempMainImageId || '');
            }

            // التحقق من وجود تغييرات فعلية
            const hasChanges = (
                Object.keys(changedFields).length > 0 ||
                imagePreviews.length > 0 ||
                imagesToDelete.length > 0 ||
                tempMainImageId !== mainImageId
            );

            if (!hasChanges) {
                toast({
                    title: "Info",
                    description: "No changes to save",
                });
                return;
            }

            // إرسال البيانات
            const updatedProject = await projectsService.updateProject(params.id, formData);

            toast({
                title: "Success",
                description: "Project updated successfully",
            });

            router.back();
        } catch (error) {
            console.error("Update error:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update project",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading || isLanguagesLoading || isCategoriesLoading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // 9. تحسين واجهة المستخدم
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
                                        <FormLabel>Category</FormLabel>
                                        <FormControl>
                                            <select
                                                className="w-full border rounded px-3 py-2 bg-background"
                                                value={field.value}
                                                onChange={field.onChange}
                                            >
                                                <option value="">Select category</option>
                                                {categories?.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.icon_svg_url && (
                                                            <Image
                                                                src={cat.icon_svg_url}
                                                                alt={cat.name}
                                                                width={18}
                                                                height={18}
                                                                className="inline-block mr-2"
                                                            />
                                                        )}
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
                                            <FormLabel>Creation Year (optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 2024" {...field} />
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
                                                <Input placeholder="Country" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Translations Tabs */}
                            {languages && languages.length > 0 && (
                                <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue={languages[0]?.code}>
                                    <TabsList className="w-full grid grid-cols-3">
                                        {languages.map((lang) => (
                                            <TabsTrigger key={lang.code} value={lang.code}>
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
                                                                disabled={isSaving}
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
                                                                disabled={isSaving}
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
                                                                disabled={isSaving}
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

                            {/* Current Images */}
                            {project?.images?.length > 0 && (
                                <div className="space-y-2">
                                    <FormLabel>Current Images</FormLabel>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                                        {project.images.map((image: any) => (
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

                            {/* New Images */}
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
                                                    <Button
                                                        type="button"
                                                        variant={preview.isMain ? "default" : "secondary"}
                                                        size="icon"
                                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => toggleMainImage(index)}
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

                            {/* Submit Buttons */}
                            <div className="flex justify-end gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={isSaving}
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