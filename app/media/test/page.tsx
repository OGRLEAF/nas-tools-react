'use client'; // 必须是客户端组件

import { usePathManager2 } from '@/app/components/pathManager';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export default function SearchComponent() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const [historyInput, setHistoryInput] = useState<string>();

    const {historyPath, pathArray, pushHistoryPath: addHistoryPath } = usePathManager2('/');

    // 1. 获取参数
    const currentSearch = searchParams.get('q') || '';

    // 2. 更新参数的处理函数
    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());

            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }

            return params.toString();
        },
        [searchParams]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // 生成新的 URL
        const newUrl = `${pathname}?${createQueryString('path', value)}`;

        // 3. 执行跳转，保持状态的关键在于 Next.js 的 Diff 算法和 scroll: false
        // router.replace(newUrl, { scroll: false });
        setHistoryInput(value)
    };

    return (
        <div>
            <h3>App Router 示例</h3>
            <input
                type="text"
                placeholder="输入搜索内容..."
                defaultValue={currentSearch} // 使用 defaultValue 配合 URL 同步
                onChange={handleChange}
                className="border p-2"
            />
            <button onClick={()=>{
                if(historyInput) {
                    const newUrl = `${pathname}?${createQueryString('path', historyInput)}`;
                    // addHistoryPath(historyInput);
                    router.push(newUrl, {scroll: false})
                }
            }}>Submit</button>
            <p>当前 URL 参数 q: {currentSearch}</p>
            { historyPath.map((v, i)=><div key={i}>{v}</div>) }
        </div>
    );
}