"use client"
import { Section } from "@/app/components/Section";
import { TagCheckboxGroup, TagCheckboxGroupProps } from "@/app/components/TagCheckbox";
import { useResource } from "@/app/utils/api/api_base";
import { Indexers } from "@/app/utils/api/indexer";
import React, { useMemo } from "react";

export default function IndexersSetting() {
    return <Section title="索引器">
        <Section title="站点设置">
            <BuiltinIndexerSetting />
        </Section>
    </Section>
}

function BuiltinIndexerSetting() {
    const { list } = useResource(new Indexers())

    const checkboxPublicOptions: TagCheckboxGroupProps['options'] = list.filter(site => site.public).map((site) => {
        return {
            value: site.id,
            label: site.name,
        }
    })
    const checkboxPrivateOptions: TagCheckboxGroupProps['options'] = list.filter(site => !site.public).map((site) => {
        return {
            value: site.id,
            label: site.name,
        }
    })
    const checkedSites = useMemo(() => list.filter(site => site.enabled).map(site => site.id), [list]);
    return <>
        <Section title="私有站点">
            <TagCheckboxGroup
                onChange={(value) => {

                }}
                value={checkedSites}
                options={checkboxPrivateOptions}
            />
        </Section>
        <Section title="公开站点">
            <TagCheckboxGroup
                onChange={(value) => {

                }}
                value={checkedSites}
                options={checkboxPublicOptions}
            />
        </Section>

    </>
}
