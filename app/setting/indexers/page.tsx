"use client"
import { Section } from "@/app/components/Section";
import { TagCheckboxGroup, TagCheckboxGroupProps } from "@/app/components/TagCheckbox";
import { useDataResource, useResource } from "@/app/utils/api/api_base";
import { BuiltinIndexerOptions, IndexerEnabledSites, IndexerOptions, IndexerResource, IndexerSite, Indexers } from "@/app/utils/api/indexer";
import { Button, Space } from "antd";
import _ from "lodash";
import React, { useState } from "react";

export default function IndexersSetting() {
    return <Section title="索引器">
        <Section title="站点设置">
            <BuiltinIndexerSetting />
        </Section>
    </Section>
}

function BuiltinIndexerSetting() {
    const { list: sites } = useResource<IndexerResource>(Indexers)
    // const { list: sites } = useList();
    const { useData, update, messageContext } = useDataResource(IndexerOptions, { useMessage: true });
    const { data: indexerOptions, setData: setIndexerOptions, } = useData();

    if (indexerOptions?.type == "Indexer") {
        const builtinIndexerOptions = (indexerOptions as BuiltinIndexerOptions)
        const sitesConfig = builtinIndexerOptions.sites_config
        const enabledSites = sites?.filter(v => v.enabled).map(v => sitesConfig[v.id].id);
        return <>
            {messageContext}
            {sites ? <IndexerSitesSelector options={sites} value={enabledSites ?? []}
                onChange={((value) => {
                    console.log(value)
                    enabledSites?.forEach((v) => builtinIndexerOptions.sites_config[v].enabled = false)
                    value.forEach((v) => builtinIndexerOptions.sites_config[v].enabled = true)
                    setIndexerOptions({
                        ...builtinIndexerOptions,
                    })
                })} /> : <></>}
            <br />
            <Button type="primary" onClick={() => { update() }}>保存</Button>
        </>
    }
    return <>{messageContext}</>
}

function IndexerSitesSelector({ options: list, value, onChange }: { options: IndexerSite[], value: IndexerSite['id'][], onChange?: (value: IndexerSite['id'][]) => void }) {
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

    const [checkedSites, setCheckedSites] = useState(value)
    // useEffect(() => setCheckedSites(list.filter(site => site.enabled).map(site => site.id)), [list]);
    return <>
        <Section title="私有站点">
            <TagCheckboxGroup
                onChange={(value) => {
                    if (!_.isEqual(value, checkedSites)) {
                        setCheckedSites(value as string[])
                        onChange?.(value as string[]);
                    }
                }}
                value={checkedSites}
                options={checkboxPrivateOptions}
            />
        </Section>
        <Section title="公开站点">
            <TagCheckboxGroup
                onChange={(value) => {
                    if (!_.isEqual(value, checkedSites)) {
                        setCheckedSites(value as string[])
                        onChange?.(value as string[]);
                    }
                }}
                value={checkedSites}
                options={checkboxPublicOptions}
            />
        </Section>
    </>
}