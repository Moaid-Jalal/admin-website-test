"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { categoriesService } from "@/app/service/categoriesService";
import { IconSearch } from "@/components/iconSearch";
import { mutate } from "swr";
import { API_BASE_URL } from "@/app/config/apiUrl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { languagesService } from "@/app/service/languagesService";
import Image from "next/image"
import Link from "next/link";
import { useToast } from "@/hooks/use-toast"

const translationSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().optional(),
});

const formSchema = z.object({
  icon_svg_url: z.string().optional(),
  translations: z.record(translationSchema),
});

export default function EditCategoryPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isError, setIsError] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const [initialFormValues, setInitialFormValues] = useState<z.infer<typeof formSchema> | null>(null);
  const { toast } = useToast();

  const { languages, isLoading: isLanguagesLoading } = languagesService.useLanguages();
  const [category_id, setCategoryId] = useState<string>("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      icon_svg_url: "",
      translations: {},
    },
  });

  useEffect(() => {
    fetchCategory();
    // eslint-disable-next-line
  }, [params.slug, languages]);

  const fetchCategory = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await categoriesService.getCategory(params.slug);
      setCategoryId(res.category.id)
      const cat = res.category;
      let translations: any = {};
      if (languages && languages.length > 0) {
        translations = languages.reduce((acc, lang) => ({
          ...acc,
          [lang.code]: {
            name: cat.translations?.[lang.code]?.name || "",
            description: cat.translations?.[lang.code]?.description || "",
          }
        }), {});
      }
      const initialVals = {
        icon_svg_url: cat.icon_svg_url || "",
        translations,
      };
      form.reset(initialVals);
      setInitialFormValues(initialVals);
      if (languages && languages.length > 0) setActiveTab(languages[0].code);
    } catch (error) {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIconSelect = (url: string) => {
    form.setValue("icon_svg_url", url);
  };

  const handleRemoveIcon = () => {
    form.setValue("icon_svg_url", "");
  };

  // Helper to get only changed fields
  const getChangedFields = (values: any) => {
    if (!initialFormValues) return values;
    const changedFields: any = {};

    // icon_svg_url
    if (values.icon_svg_url !== (initialFormValues as any).icon_svg_url) {
      changedFields.icon_svg_url = values.icon_svg_url;
    }

    // translations: only changed languages/fields
    const changedTranslations: any = {};
    for (const lang in values.translations) {
      const changedLangFields: any = {};
      const currentLang = values.translations[lang] || {};
      const initialLang = (initialFormValues as any).translations?.[lang] || {};
      Object.keys(currentLang).forEach((fieldKey: string) => {
        if (currentLang[fieldKey] !== initialLang[fieldKey]) {
          changedLangFields[fieldKey] = currentLang[fieldKey];
        }
      });
      if (Object.keys(changedLangFields).length > 0) {
        changedTranslations[lang] = changedLangFields;
      }
    }
    if (Object.keys(changedTranslations).length > 0) {
      changedFields.translations = changedTranslations;
    }

    return changedFields;
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    try {
      const changedFields = getChangedFields(values);

      if (Object.keys(changedFields).length === 0) {
        setIsSaving(false);
        toast({
            title: "No changes detected",
            description: "Please make some changes before saving.",
            variant: "default",
        });
        return;
      }


      const res = await categoriesService.updateCategory(category_id, changedFields);

      toast({
        title: "Success",
        description: "Category updated successfully.",
        variant: "default",
      })


      const newValues: any = {
        // slug: changedFields.translations["en"].name || initialFormValues?.translations["en"].name,
        icon_svg_url: changedFields.icon_svg_url || initialFormValues?.icon_svg_url,
        name: changedFields.translations["en"].name || initialFormValues?.translations["en"].name,
        description: changedFields.translations["en"].description || initialFormValues?.translations["en"].description,
      }

      if(res.slug) {
        newValues.slug = res.slug
      }

      mutate(
        `${API_BASE_URL}/categories`,
        (prev: any) =>
          Array.isArray(prev)
            ? prev.map((cat: any) =>
                cat.slug === params.slug
                  ? { ...cat, ...newValues }
                  : cat
              )
            : prev,
        false
      );

      router.push(`/admin/our-sectors/categories`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || isLanguagesLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <p className="text-lg text-muted-foreground mb-4">Category not found</p>
        <Button onClick={fetchCategory} variant="outline">
          Refetch Category
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/our-sectors/categories`}>
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Category</h1>
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
                name="icon_svg_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Icon (SVG)</FormLabel>
                    <IconSearch onSelect={handleIconSelect} />
                    {field.value && (
                      <div className="mt-2 flex items-center gap-2">
                        <Image
                          src={`${field.value}?color=white`}
                          alt="Selected Icon"
                          width={48}
                          height={48}
                        />
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

              {languages && (
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
                        name={`translations.${lang.code}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={`Enter ${lang.name} name`}
                                {...field}
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

              <div className="mt-8">
                <div className="flex flex-col items-center justify-center border rounded-xl bg-muted py-8 px-4 max-w-xs mx-auto shadow">
                  <div className="mb-4 flex items-center justify-center w-28 h-28 rounded-full border">
                    {form.watch("icon_svg_url") ? (
                      <Image
                        src={`${form.watch("icon_svg_url")}?color=white`}
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
                    {form.watch(`translations.${activeTab}.name`) || "Category Name"}
                  </div>
                  <div className="text-muted-foreground text-center">
                    {form.watch(`translations.${activeTab}.description`) || "Category description will appear here."}
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
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
