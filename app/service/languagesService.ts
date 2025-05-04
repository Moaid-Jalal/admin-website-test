import useSWR from 'swr';


import { API_BASE_URL } from "@/app/config/apiUrl";
import { Language } from '@/app/types/languages';
// import { Category } from "@/app/types/languages";

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

      // Languages are currently static, no need to request data from the server
      const languages: Language[] = [
        { id: '1', code: 'en', name: 'English' },
        { id: '2', code: 'fr', name: 'French' },
        { id: '3', code: 'tr', name: 'Turkish' }
    ];

        // const fetcher = async (url: string) => {
        //     const res = await fetch(url, { credentials: 'include' });
        //     if (!res.ok) {
        //         throw new Error('Failed to fetch');
        //     }
        //     return res.json();
        // };

        // const { data, error, isLoading, mutate} = useSWR(
        //     `${API_BASE_URL}/languages`,
        //     fetcher,
        //     {
        //         revalidateOnFocus: false,
        //         revalidateOnReconnect: true,
        //         dedupingInterval: 1000 * 60 * 10,
        //     }
        // );

        return {
            languages,
            error: undefined,
            isLoading: false,
            refetch: () => {},
        };
    },

  async createLanguage(data: Partial<Language>): Promise<Language> {
    const res = await fetch(`${API_BASE_URL}/languages`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create language");
    return res.json();
  },

  async updateLanguage(id: string, data: Partial<Language>): Promise<Language> {
    const res = await fetch(`${API_BASE_URL}/languages/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update language");
    return res.json();
  },

  async deleteLanguage(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/languages/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete language");
  },
}