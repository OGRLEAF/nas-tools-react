import Link from "next/link";
import React from "react";


export function FileLink({ basePath, targetPath, children }:
    { basePath?: string, targetPath: string, children?: React.ReactNode }) {
    return <Link href={
        {
            pathname: "/media/file",
            query: {
                path: targetPath
            }
        }
    }>{children}</Link>
}
