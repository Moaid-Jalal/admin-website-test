import { useSWRConfig } from "swr";
import useSWRInfinite from "swr/infinite";

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
    useMessages() {
        const fetcher = async (url: string) => {
            const res = await fetch(url, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        };

        const { mutate } = useSWRConfig();

        const getKey = (pageIndex: number, previousPageData: any) => {
            if (previousPageData && previousPageData.length < 10) return null;
            const offset = pageIndex * 10;
            return `${API_BASE_URL}/messages?offset=${offset}`;
        };

        const {
            data,
            error,
            size,
            setSize,
            isValidating,
        } = useSWRInfinite(getKey, fetcher, {
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
            messages: data ? data.flat() : [],
            error,
            isLoading: !data && !error,
            isValidating,
            loadMore: () => setSize(size + 1),
            hasMore: data ? data[data.length - 1]?.length === 10 : false,
            refetch,
        };
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