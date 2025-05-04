"use client"

import { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Pencil, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from "@/app/config/apiUrl";
import { mutate } from "swr";
import { Language } from '@/app/types/languages';
import { languagesService } from "@/app/service/languagesService";
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { NewLanguagePage } from './new';
import { EditLanguagePage } from './edit';
import Link from 'next/link';

const formSchema = z.object({
code: z.string().min(2, { message: "Code is required (e.g. ar, en, fr)" }),
name: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

export default function LanguagesPage() {

    const {
        languages,
        isLoading,
        error,
        refetch
    } = languagesService.useLanguages();
    const [loadingDelete, setLoadingDelete] = useState(false);

    const [newLanguageDrop, setNewLanguageDrop] = useState(false);
    const [editLanguageDrop, setEditLanguageDrop] = useState("");

    const { toast } = useToast();

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this language?")) return;

        setLoadingDelete(true);

        try {
            await languagesService.deleteLanguage(id);
            mutate(
                `${API_BASE_URL}/languages`,
                (prev: Language[] = []) => prev.filter((l) => l.id !== id),
                false
            );

            toast({
                title: "Success",
                description: "category deleted successfully",
                variant: "default",
            });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setLoadingDelete(false);
        }
    };

    const onCloseCreateNewLanguage = useCallback(() => {
        setNewLanguageDrop(false);
    }, [])

    const onCloseEditNewLanguage = useCallback(() => {
        setEditLanguageDrop("");
    }, [])

return (
    <>
        {editLanguageDrop && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <EditLanguagePage id={editLanguageDrop} onClose={onCloseEditNewLanguage}/>
            </div>
        )}

        {newLanguageDrop && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <NewLanguagePage onClose={onCloseCreateNewLanguage}/>
            </div>
        )}



        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold">Categories</h1>
                </div>
                {/* <div>
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => setNewLanguageDrop(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Language
                    </Button>
                </div> */}
            </div>

            <Card>
                <CardHeader>
                <CardTitle>Languages List</CardTitle>
                </CardHeader>
                <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : languages &&  languages.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Name</TableHead>
                            {/* <TableHead className="text-right">Actions</TableHead> */}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {languages.map((lang) => (
                            <TableRow key={lang.id}>
                                <TableCell>{lang.code}</TableCell>
                                <TableCell>{lang.name}</TableCell>
                                {/* <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setEditLanguageDrop(lang.id)}
                                            aria-label="Edit language"
                                            >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600"
                                            onClick={() => handleDelete(lang.id)}
                                            disabled={loadingDelete}
                                            aria-label="Delete language"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell> */}
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex justify-center items-center h-32">
                        <p className="text-muted-foreground">No languages found</p>
                    </div>
                )}
                </CardContent>
            </Card>
        </div>
    </>
);
}
