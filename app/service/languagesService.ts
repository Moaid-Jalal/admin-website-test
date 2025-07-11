import { API_BASE_URL } from "@/app/config/apiUrl";
import { Language } from '@/app/types/languages';

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

export const languagesService = {
    useLanguages() : {
        languages: Language[] | [];
        error: Error | undefined;
        isLoading: boolean;
        refetch: () => void;
    } {
      const languages: Language[] = [
        { id: '1', code: 'en', name: 'English' },
        { id: '2', code: 'fr', name: 'French' },
        { id: '3', code: 'tr', name: 'Turkish' }
    ];

        return {
            languages,
            error: undefined,
            isLoading: false,
            refetch: () => {},
        };
    },
}