import { API_BASE_URL } from "@/app/config/apiUrl";

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

export const loginService = {
    async login(email: string, password: string): Promise<{ token: string }> {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new ApiError(errorData);
        }

        return response.json();
    },

    async logout(): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new ApiError(errorData);
        }

        return response.json();
    },

    async checkAuth(): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/check`, {
                method: 'GET',
                credentials: 'include',
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Authentication check failed:', errorData);
                throw new ApiError(errorData);  
            }

            const data = await response.json(); 
            return data;  
        } catch (err) {
            throw err;
        }
    }
}; 