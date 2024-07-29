import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback } from "react";


export function FileLink({ basePath, targetPath, children }:
    { basePath?: string, targetPath: string, children?: React.ReactNode }) {
    return <Link href={
        {
            pathname: basePath || "/media/file",
            query: {
                path: targetPath
            }
        }
    }>{children}</Link>
}

export function useFileRouter(options?:
    { basePath?: string, }) {
    const router = useRouter();
    const push = useCallback((targetPath: string) => {
        router.push(`/media/file?${new URLSearchParams({ path: targetPath }).toString()}`)
    }, [router])
    const fallback = useCallback((to: string, from: string) => {
        router.replace(`/media/file?${new URLSearchParams({ path: to, from }).toString()}`)
    }, [router])
    return {
        push,
        fallback,
    }
}