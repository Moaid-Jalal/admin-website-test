import useSWRInfinite from 'swr/infinite';
import { API_BASE_URL } from "@/app/config/apiUrl";
import { useSWRConfig } from 'swr';

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

export const projectsService = {
    useCategoryProjects(categoryName: string) {
        const fetcher = async (url: string) => {
            const res = await fetch(url, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        };

        const { mutate } = useSWRConfig();

        const getKey = (pageIndex: number, previousPageData: any) => {
            if (previousPageData && previousPageData.length < 10) return null;
            const offset = pageIndex * 10;
            return `${API_BASE_URL}/categories/${categoryName}/projects?offset=${offset}`;
        };

        const {
            data,
            error,
            size,
            setSize,
            isValidating,
        } = useSWRInfinite<any[]>(getKey, fetcher, {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            dedupingInterval: 1000 * 60 * 10,
        });

        const refetch = async () => {
            if (!error) return;
            for (let i = 0; i < size; i++) {
                const key = getKey(i, i === 0 ? null : data?.[i - 1]);
                if (key) await mutate(key, undefined);
            }
        };

        return {
            projects: data ? data.flat() : [],
            getKey,
            size,
            error,
            isLoading: !data && !error,
            isValidating,
            loadMore: () => setSize(size + 1),
            hasMore: data ? data[data.length - 1]?.length === 10 : false,
            refetch,
        };
    },

    async getProject(id: string): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/projects/admin/${id}`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new ApiError(errorData);
        }

        return response.json();
    },

    async updateProject(projectId: string, data: FormData): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/projects/update/${projectId}`, {
            method: "PUT",
            credentials: "include",
            body: data
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new ApiError(errorData);
        }

        return response.json();
    },

    async createProject(projectData: any): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/projects/create`, {
            method: "POST",
            credentials: "include",
            body: projectData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new ApiError(errorData);
        }

        return response.json();
    },

    async deleteProject(projectId: string): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/projects/delete/${projectId}`, {
            method: "DELETE",
            credentials: "include"
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new ApiError(errorData);
        }

        return response.json();
    },

    async searchProject(query: string): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/projects/search?query=${encodeURIComponent(query)}`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new ApiError(errorData);
        }

        console.log(response.json());

        return response.json();
    }
};