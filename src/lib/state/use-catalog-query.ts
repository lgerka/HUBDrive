"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

export interface CatalogQuery {
    q: string;
    status: string;
    brand: string;
    sort: string;
}

export function useCatalogQuery() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const q = searchParams.get('q') || '';
    const status = searchParams.get('status') || 'all';
    const brand = searchParams.get('brand') || 'all';
    const sort = searchParams.get('sort') || 'newest';

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());

            if (value && value !== 'all') {
                params.set(name, value);
            } else {
                params.delete(name);
            }

            // Reset page if we had pagination (not needed yet but good practice)
            // params.delete('page');

            return params.toString();
        },
        [searchParams]
    );

    const setQuery = useCallback((value: string) => {
        const queryString = createQueryString('q', value);
        startTransition(() => {
            router.replace(`${pathname}?${queryString}`);
        });
    }, [createQueryString, pathname, router]);

    const setStatus = useCallback((value: string) => {
        const queryString = createQueryString('status', value);
        startTransition(() => {
            router.replace(`${pathname}?${queryString}`);
        });
    }, [createQueryString, pathname, router]);

    const setBrand = useCallback((value: string) => {
        const queryString = createQueryString('brand', value);
        startTransition(() => {
            router.replace(`${pathname}?${queryString}`);
        });
    }, [createQueryString, pathname, router]);

    const setSort = useCallback((value: string) => {
        const queryString = createQueryString('sort', value);
        startTransition(() => {
            router.replace(`${pathname}?${queryString}`);
        });
    }, [createQueryString, pathname, router]);

    const resetFilters = useCallback(() => {
        startTransition(() => {
            router.replace(pathname);
        });
    }, [pathname, router]);

    return {
        q,
        status,
        brand,
        sort,
        setQuery,
        setStatus,
        setBrand,
        setSort,
        resetFilters,
        isPending,
        activeFiltersCount: [
            q !== '',
            status !== 'all',
            brand !== 'all',
        ].filter(Boolean).length
    };
}
