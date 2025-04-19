const API_BASE_URL = "http://localhost:4000";

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
    async getProject(offset: number): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/api/projects?offset=${offset}`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new ApiError(errorData);
        }

        return response.json();
    },

    async createProject(projectData: any): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/api/projects/create`, {
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
        const response = await fetch(`${API_BASE_URL}/api/projects/delete/${projectId}`, {
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
        const response = await fetch(`${API_BASE_URL}/api/projects/search?query=${encodeURIComponent(query)}`, {
            method: "GET",
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new ApiError(errorData);
        }

        console.log(response.json())

        return response.json();
    }
}; 