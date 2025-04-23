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
import Link from "next/link";
import { categoriesService } from "@/app/service/categoriesService";
import { IconSearch } from "@/components/iconSearch";
import { mutate } from "swr";
import { API_BASE_URL } from "@/app/config/apiUrl";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().optional(),
  icon_svg_url: z.string().optional(),
});

export default function EditCategoryPage({ params }: { params: { name: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isError, setIsError] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      icon_svg_url: "",
    },
  });

  useEffect(() => {
    fetchCategory();
    // eslint-disable-next-line
  }, [params.name]);

  const fetchCategory = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await categoriesService.getCategory(params.name);


      form.reset({
        name: res.name,
        description: res.description,
        icon_svg_url: res.icon_svg_url || "",
      });

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    try {
      const res = await categoriesService.updateCategory(params.name, values);


      const fsdsd = {
        name: values.name,
        description: values.description,
        icon_svg_url: values.icon_svg_url,
      }

      mutate(
        `${API_BASE_URL}/categories`,
        (prev: any) =>
          Array.isArray(prev)
            ? prev.map((cat: any) =>
                cat.name === params.name
                  ? { ...cat, ...fsdsd }
                  : cat
              )
            : prev,
        false
      );

      router.back();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update category");
    } finally {
      setIsSaving(false);
    }
  }

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
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Categories
        </Button>
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
                  <div className="mb-4 flex items-center justify-center w-28 h-28 rounded-full border">
                    {form.watch("icon_svg_url") ? (
                      <img
                        src={form.watch("icon_svg_url")}
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
