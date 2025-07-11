"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { languagesService } from "@/app/service/languagesService";
import * as z from 'zod';
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from '@/components/ui/table';
import Link from 'next/link';

export default function LanguagesPage() {
    const {
        languages,
        isLoading,
    } = languagesService.useLanguages();

return (
    <>
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {languages.map((lang) => (
                            <TableRow key={lang.id}>
                                <TableCell>{lang.code}</TableCell>
                                <TableCell>{lang.name}</TableCell>
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
