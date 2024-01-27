"use client"
import { Section } from "@/app/components/Section";
import { TagCheckboxGroup, TagCheckboxGroupProps } from "@/app/components/TagCheckbox";
import { useDataResource, useResource } from "@/app/utils/api/api_base";
import { IndexerEnabledSites, IndexerResource, IndexerSite, Indexers } from "@/app/utils/api/indexer";
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
    const { useList } = useResource<IndexerResource>(new Indexers())
    const { list: sites } = useList();
    const { useData, update, messageContext } = useDataResource(new IndexerEnabledSites(), { useMessage: true });
    const { data: enabledSites, setData: setEnabledSites, } = useData();
    return <>
        {messageContext}
        {sites ? <IndexerSitesSelector options={sites} value={enabledSites ?? []}
            onChange={((value) => { setEnabledSites(value) })} /> : <></>}
        <br />
        <Button type="primary" onClick={() => { update() }}>保存</Button>
    </>
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