"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { messagesService } from "@/app/service/messagesService";
import { format } from "date-fns";
import { Loader2, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export default function AdminContactPage() {
  const [loadingDelete, setLoadingDelete] = useState(false);
  const { toast } = useToast();
  const { messages, error, isLoading, refetch } = messagesService.useMessages();

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this message?");
    if (!confirmDelete) return;
    if (loadingDelete) return;

    setLoadingDelete(true);
    try {
      await messagesService.deleteMessage(id);
      toast({
        title: "Message deleted",
        description: "The message has been deleted successfully.",
        variant: "default",
      });
      refetch && refetch();
    } catch {
      toast({
        title: "Error deleting message",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingDelete(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading messages...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-500">{error instanceof Error ? error.message : "Error loading messages"}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-24 px-4">
      {loadingDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Contact Messages</h1>
          <p className="text-muted-foreground mt-2">
            View and manage contact form submissions
          </p>
        </div>

        <div className="space-y-6">
          {(!messages || messages.length === 0) ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  No messages received yet.
                </div>
              </CardContent>
            </Card>
          ) : (
            messages.map((message: Message) => (
              <Card key={message.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{message.name}</CardTitle>
                      <div className="text-muted-foreground mt-1">
                        {message.email}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(message.created_at), "PPpp")}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <p className="whitespace-pre-wrap">{message.message}</p>
                  <button
                    disabled={loadingDelete}
                    onClick={() => handleDelete(message.id)}
                    className="text-red-500 hover:text-red-700 transition"
                    title="Delete message"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}