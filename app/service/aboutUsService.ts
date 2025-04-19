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

export const aboutUsService = {
    async getAboutUsInformation(): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/api/aboutus/admin`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new ApiError(errorData);
        }

        return response.json();
    },

    async updateAboutUsInformation(aboutUsData: any): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/api/aboutus/content-sections`, {
            method: "PUT",
            credentials: "include",
            body: JSON.stringify(aboutUsData),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new ApiError(errorData);
        }

        return response.json();
    }
}; 