"use client"
import React, { useEffect, useState } from "react";
import { Section } from "@/app/components/Section";
import { Button, Checkbox, Form, Switch } from "antd";
import { Scraper, ScraperConfig, ScraperConfigKey, nfoAvaliableTypeMovie, nfoAvaliableTypeTv, picAvaliableTypeMovie, picAvaliableTypeTv } from "@/app/utils/api/scraper";
import { ServerConfig } from "@/app/utils/api/serverConfig";
import { NastoolServerConfig } from "@/app/utils/api/api";
import { useSubmitMessage } from "@/app/utils";
import { useAPIContext } from "@/app/utils/api/api_base";

type Unify<T extends ScraperConfigKey | ScraperConfig> = T['scraper_nfo']['movie'] | T['scraper_nfo']['tv'] | T['scraper_pic']['movie'] | T['scraper_pic']['tv']
type UnifiedKey = Unify<ScraperConfigKey>
type UnifiedValue = Unify<ScraperConfig>

const checkboxLabelMap: Record<UnifiedKey, string> = {
    basic: "基础信息",
    credits: "演职人员",
    credits_chinese: "中文演职人员",
    episode_basic: "集-基础信息",
    episode_credits: "集-演职人员",
    season_basic: "季-基础信息",
    backdrop: "fanart",
    background: "background",
    banner: "banner",
    disc: "disc",
    logo: "logo",
    poster: "poster",
    thumb: "thumb",
    clearart: "clearart",
    episode_thumb: "episode_thumb",
    episode_thumb_ffmpeg: "episode_thumb_ffmpeg",
    season_banner: "season_banner",
    season_poster: "season_poster",
    season_thumb: "season_thumb"
}

function optionsFrom<K extends UnifiedKey>(option: Record<K, boolean>) {
    return (Object.entries(option) as [K, boolean][])
        .map(([k, v]) => {
            return {
                label: checkboxLabelMap[k],
                value: k,

            }
        })
}

function dataFrom<K extends UnifiedKey>(option: Record<K, boolean>) {
    return (Object.entries(option) as [K, boolean][])
        .filter(([k, v]) => v)
        .map(([k, v]) => k)
}

interface ScraperFormData {
    enable: boolean,
    scraperConfig: {
        scraper_nfo: {
            movie: ScraperConfigKey['scraper_nfo']['movie'][],
            tv: ScraperConfigKey['scraper_nfo']['tv'][]
        },
        scraper_pic: {
            movie: ScraperConfigKey['scraper_pic']['movie'][],
            tv: ScraperConfigKey['scraper_pic']['tv'][]
        }
    }

}

const scraperOptions = {
    scraper_nfo: {
        movie: nfoAvaliableTypeMovie.map((v) => ({ label: checkboxLabelMap[v], value: v })),
        tv: nfoAvaliableTypeTv.map((v) => ({ label: checkboxLabelMap[v], value: v })),
    },
    scraper_pic: {
        movie: picAvaliableTypeMovie.map((v) => ({ label: checkboxLabelMap[v], value: v })),
        tv: picAvaliableTypeTv.map((v) => ({ label: checkboxLabelMap[v], value: v })),
    }
}

export default function ScraperSetting() {
    const [scraperConfig, setScraperConfig] = useState<ScraperConfig>();
    const [scraperEnable, setScraperEnable] = useState(false);
    const {API} = useAPIContext()
    const refresh = async () => {
        const scraperApi = new Scraper(API);
        const scraperConfig = await scraperApi.config.get();
        setScraperConfig(scraperConfig)
        const config = new ServerConfig(API);
        const enableScraper = (await config.get()).media.nfo_poster;
        setScraperEnable(enableScraper)
    }
    useEffect(() => { refresh() }, [])
    const initialValues = {
        scraperConfig: scraperConfig,
        enable: scraperEnable
    }

    const ScraperForm = ({ scraperConfig }: { scraperConfig?: ScraperConfig }) => {
        const { contextHolder, handle } = useSubmitMessage("scraper");
        const [form] = Form.useForm()
        useEffect(() => {
            form.setFieldsValue(scraperConfig)
        }, [scraperConfig, form])
        const onFinish = async (values: ScraperFormData) => {
            const updateValues: ScraperConfig = values.scraperConfig;
            await new Scraper(API).config.update(updateValues);
            new ServerConfig(API).update({ media: { nfo_poster: values.enable } } as NastoolServerConfig)
        }

        return <Form form={form} layout="vertical" initialValues={initialValues} onFinish={(values) => handle(onFinish(values))}>
            {contextHolder}
            <Form.Item label="刮削元数据及图片" name={["enable"]} valuePropName="checked">
                <Switch />
            </Form.Item>
            <Form.Item label="电影元数据" name={["scraperConfig", "scraper_nfo", "movie"]}>
                <Checkbox.Group options={scraperOptions.scraper_nfo.movie} />
            </Form.Item>
            <Form.Item label="电视剧元数据" name={["scraperConfig", "scraper_nfo", "tv"]}>
                <Checkbox.Group options={scraperOptions.scraper_nfo.tv} />
            </Form.Item>
            <Form.Item label="电影图片" name={["scraperConfig", "scraper_pic", "movie"]}>
                <Checkbox.Group options={scraperOptions.scraper_pic.movie} />
            </Form.Item>
            <Form.Item label="电视剧图片" name={["scraperConfig", "scraper_pic", "tv"]}>
                <Checkbox.Group options={scraperOptions.scraper_pic.tv} />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit">保存</Button>
            </Form.Item>
        </Form>

    }
    return <Section title="刮削设置" onRefresh={refresh}>
        <ScraperForm scraperConfig={scraperConfig} />
    </Section>
}

