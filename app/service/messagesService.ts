const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export class ApiError extends Error {
    data: any;

    constructor(error: string | any) {
        super(typeof error === "string" ? error : error.message);
        this.name = "ApiError";

        if (typeof error !== "string" && error) {
            this.data = error;
        }
    }
}

export const messagesService = {
    async getMessages(): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/messages`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new ApiError(errorData);
        }

        return response.json();
    },

    async deleteMessage(messageId: string): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
            method: "DELETE",
            credentials: "include"
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new ApiError(errorData);
        }

        return response.json();
    }
}; 