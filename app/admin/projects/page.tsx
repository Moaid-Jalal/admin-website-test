"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pencil, Trash2, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { projectsService } from '@/app/service/projectsService';
import { useDebounce } from '@/hooks/use-debounce';

interface Project {
  category : string,
  country : string,
  created_at : string,
  creation_date : string,
  description : string,
  id : string,
  short_description: string, 
  title: string, 
}

export default function ProjectsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  const [isError, setIsError] = useState(false);

  const [loadingDelete, setLoadingDelete] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<Project[]>([]);
  const [searchError, setSearchError] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearch) {
      searchProjects(debouncedSearch);
    } else {
      setIsSearching(false);
      setSearchResult([]);
    }
  }, [debouncedSearch]);

  const searchProjects = async (query: string) => {
    setSearchError("");
    setIsSearching(true);

    try {
      const res = await projectsService.searchProject(query);

      setSearchResult(res);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search projects",
        variant: "destructive",
      });
      setSearchError("Failed to search projects");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);


  const fetchProjects = async () => {
    if (!hasMore || isInitialLoading || isFetchingMore) return;
  
    if (isFirstLoad) {
      setIsInitialLoading(true);
      setIsFirstLoad(false);
    } else {
      setIsFetchingMore(true);
    }
  
    try {
      const res = await projectsService.getProjects(offset);
  
      setHasMore(res.length === 10);
      setOffset((prevOffset) => prevOffset + res.length);
  
      setProjects((prevProjects) => [...prevProjects, ...res]);
    } catch (error) {
      if(projects.length === 0) {
        setIsFirstLoad(true);
      }
      setIsError(true)
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      if (isFirstLoad) {
        setIsInitialLoading(false);
      } else {
        setIsFetchingMore(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    if(loadingDelete) return;

    setLoadingDelete(true);

    try {
      await projectsService.deleteProject(id);

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });

      fetchProjects();
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

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setIsSearching(value.length > 0);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <p className="text-lg text-muted-foreground mb-4">Project not found</p>
        <Button onClick={fetchProjects} variant="outline">
          refetch Project
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {loadingDelete && (
        <div className="fixed inset-0 bg-gray-900 opacity-50 z-50 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Link href="/admin/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Project
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project List</CardTitle>
        </CardHeader>
        <CardContent>

        <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, category, or client..."
                className="pl-8 pr-10"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>



          {isInitialLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : isSearching ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : searchTerm.length > 0 ?(
            <div>
              {searchError ? (
                <div className="flex justify-center items-center h-32">
                  <p className="text-red-500">{searchError}</p>
                </div>
              ) : searchResult.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                        <TableHead>Country</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResult.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>{project.title}</TableCell>
                        <TableCell>{project.category}</TableCell>
                        <TableCell>{project.country}</TableCell>
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
                  <p className="text-muted-foreground">No projects found</p>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                    <TableHead>Country</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>{project.title}</TableCell>
                    <TableCell>{project.category}</TableCell>
                    <TableCell>{project.country}</TableCell>
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
          )}

          {hasMore && !isInitialLoading && projects.length > 0 && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                size="lg"
                className="flex items-center gap-2 px-8 py-2 rounded-full shadow"
                onClick={fetchProjects}
                disabled={isFetchingMore}
              >
                {isFetchingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>load more</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {projects.length === 0 && !isInitialLoading && searchTerm.length === 0 &&(
            <div className="flex justify-center items-center h-32">
              <p className="text-muted-foreground">No projects found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}