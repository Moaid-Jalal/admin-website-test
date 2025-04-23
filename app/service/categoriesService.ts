import useSWR from 'swr';


import { API_BASE_URL } from "@/app/config/apiUrl";
import { Category } from "@/app/types/categories";

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

export const categoriesService = {
    useCategories() : {
        data: Category[] | undefined;
        error: Error | undefined;
        isLoading: boolean;
        refetch: () => void;
    } {
        const fetcher = async (url: string) => {
            const res = await fetch(url, { credentials: 'include' });
            if (!res.ok) {
                throw new Error('Failed to fetch');
            }
            return res.json();
        };

        const { data, error, isLoading, mutate} = useSWR(
            `${API_BASE_URL}/categories`,
            fetcher,
            {
                revalidateOnFocus: false,
                revalidateOnReconnect: true,
                dedupingInterval: 1000 * 60 * 10,
            }
        );

        return {
            data,
            error,
            isLoading,
            refetch: () => mutate(),
        };
    },

    async createCategory(categoryData: any): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/categories/new`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(categoryData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new ApiError(errorData);
        }

        return response.json();
    },

    async deleteCategory(id: string): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
            method: "DELETE",
            credentials: "include"
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new ApiError(errorData);
        }

        return response.json();
    },

    async updateCategory(id: string, categoryData: any): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(categoryData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new ApiError(errorData);
        }

        return response.json();
    },

    async getCategory(id: string): Promise<Category> {
        const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new ApiError(errorData);
        }

        return response.json();
    }
}