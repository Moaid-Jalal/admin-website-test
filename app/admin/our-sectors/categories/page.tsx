"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { categoriesService } from '@/app/service/categoriesService';
import { useToast } from '@/hooks/use-toast';
import { mutate } from 'swr';
import { API_BASE_URL } from '@/app/config/apiUrl';
import { Category } from "@/app/types/categories";
import Image  from "next/image"

export default function CategoriesPage() {
  const router = useRouter();
  const { data: categories, isLoading, error, refetch } = categoriesService.useCategories()
  const [loadingDelete, setLoadingDelete] = useState(false);

  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    if(loadingDelete) return;

    setLoadingDelete(true);

    try {
      await categoriesService.deleteCategory(id);

      toast({
        title: "Success",
        description: "category deleted successfully",
        variant: "default",
      });

      mutate(
        `${API_BASE_URL}/categories`,
        categories?.filter((cat) => cat.id !== id),
        false
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setLoadingDelete(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <p className="text-lg text-muted-foreground mb-4">Categories not found</p>
        <Button onClick={refetch} variant="outline">
          Refetch Categories
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="sm:flex items-center gap-4">
          <Link href={`/admin`}>
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">categories</h1>
        </div>
        <Link href="/admin/our-sectors/categories/new">
          <Button className=''>
            <Plus className="mr-2 h-4 w-4" />
            Add New Category
          </Button>
        </Link>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>Category List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : categories && categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>see projects</TableHead>
                  <TableHead>project count</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((cat: Category) => (
                  <TableRow key={cat.id}>
                    <TableCell>{cat.name}</TableCell>
                    <TableCell>{cat.description.slice(0, 10)}{cat.description.length > 10 && '...'}</TableCell>
                    <TableCell>
                      {cat.icon_svg_url && (
                        <Image
                          src={`${cat.icon_svg_url}?color=white`}
                          alt={cat.name}
                          width={32}
                          height={32}
                          style={{ display: "inline-block", verticalAlign: "middle" }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{cat.slug}</TableCell>
                    <TableCell>
                      <Link href={`/admin/our-sectors/categories/${cat.slug}/projects`}>
                        <Button
                          variant="link"
                        >
                          + View
                        </Button>
                      </Link>
                    </TableCell>
                    <TableCell>{cat.project_count}</TableCell>
                    <TableCell>
                      {cat.created_at
                        ? (() => {
                            const date = new Date(cat.created_at);
                            return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
                          })()
                      : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/our-sectors/categories/${cat.slug}/edit`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        disabled={loadingDelete}
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(cat.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex justify-center items-center h-32">
              <p className="text-muted-foreground">No categories found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
