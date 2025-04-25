"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Trash2, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { projectsService } from "@/app/service/projectsService";
import { mutate } from "swr";
import { API_BASE_URL } from "@/app/config/apiUrl";


export default function CategoryProjectsPage({ params }: { params: { name: string } }) {
  const categoryName = params.name
  const router = useRouter();
  const {
    projects,
    error,
    isLoading,
    isValidating,
    loadMore,
    hasMore,
    refetch
  } = projectsService.useCategoryProjects(params.name);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const { toast } = useToast();


    const handleDelete = async (id: string) => {
      if (!confirm('Are you sure you want to delete this category?')) return;
      if(loadingDelete) return;

      setLoadingDelete(true);
  
      try {
        await projectsService.deleteProject(id);

        toast({
          title: "Success",
          description: "Project deleted successfully",
          variant: "default",
        });
  
        mutate(
          `${API_BASE_URL}/categories/${categoryName}/projects`,
          projects?.filter((cat) => cat.id !== id),
          false
        );
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete project",
          variant: "destructive",
        });
      } finally {
        setLoadingDelete(false);
      }
    };
  

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !projects) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <p className="text-lg text-muted-foreground mb-4">Category or projects not found</p>
          <Button onClick={refetch} variant="outline">
          Refetch
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="sm:flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{categoryName}</h1>
        </div>
        <Link href="/admin/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Project
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects in this Category</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>short-des</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>{project.title}</TableCell>
                    <TableCell>{project.short_description.split(0, 10)}</TableCell>
                    <TableCell>
                      {new Date(project.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/projects/${project.id}/edit`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        disabled={loadingDelete}
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(project.id)}
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
              <p className="text-muted-foreground">No projects found in this category</p>
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={loadMore}
                disabled={isValidating}
                variant="outline"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
