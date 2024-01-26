import { APIArrayResourceBase, ResourceType } from "../api_base"

export interface PluginFormItem {
    title: string,
    type: "div" | "switch" | "text" | "form-selectgroup" | "details" | "textarea"
    // summary?: string,
    // tooltip?: string,
    // content?: PluginFormField
}

export interface PluginFormItemDiv extends PluginFormItem {
    type: "div",
    content: PluginFormItem[][]
}

export interface PluginFormFieldSwitch extends PluginFormItem {
    type: "switch"
    required: "required" | ""
    summary: string,
    tooltip: string,
    id: string,
}

export interface PluginFormFieldText extends PluginFormItem {
    type: "text"
    required: "required" | ""
    tooltip: string,
    content: { id: string, placeholder: string }[],
}

export interface PluginFormFieldTextArea extends PluginFormItem {
    type: "textarea"
    required: "required" | ""
    tooltip: string,
    content: { id: string, placeholder: string }
}

export interface PluginFormFieldSelectItem {
    id: number,
    name: string,
}

export interface PluginFormFieldSelectGroup extends PluginFormItem {
    type: "form-selectgroup",
    id: string,
    required: "required" | ""
    tooltip: string,
    content: Record<string, PluginFormFieldSelectItem>,
}

export interface PluginFormFieldDetails extends PluginFormItemDiv {
    summary: string,
    tooltip: string,
}

export interface PluginProfile {
    key: string,
    name: string,
    desc: string,
    version: string,
    icon: string,
    prefix: string,
    color: string,
    fields: PluginFormItem[],
    config: any
}


export interface PluginResource extends ResourceType {
    ItemType: PluginProfile,

}

export class Plugin extends APIArrayResourceBase<PluginResource>{
    public async list() {
        const result = await (await this.API).post<{ result: Record<string, PluginProfile> }>("plugin/list", { auth: true });
        return Object.entries(result.result).map(([key, value]) => ({ ...value, key }));
    }

    protected async listHook(options?: any): Promise<PluginProfile[]> {
        return await this.list();
    }

    protected async update(pluginId: PluginProfile['key'], config: any) {
        const result = await (await this.API).post("plugin/config/update", {
            auth: true,
            json: true,
            data: {
                plugin: pluginId,
                config: config
            }
        })
    }

    protected async uninstall(pluginId: PluginProfile['key']) {
        const result = await (await this.API).post("plugin/uninstall",
            {
                auth: true,
                data: {
                    id: pluginId
                }
            })
    }

    protected async deleteHook(value: PluginProfile, options?: any): Promise<boolean> {
        await this.uninstall(value.key)
        return true;
    }

    // protected async updateHook(value: PluginProfile): Promise<boolean> {
    //     await this.update(value.key, value.config)
    //     return true
    // }
}

export interface PluginRepoItem {
    key: string,
    id: string,
    installed: boolean,
    name: string,
    desc: string,
    version: string,
    icon: string,
    color: string,
    author: string,
    author_url: string
}

export interface PluginRepoResource extends ResourceType {
    ItemType: PluginRepoItem,
    AddItemType: PluginRepoItem['key']
}


export class PluginRepo extends APIArrayResourceBase<PluginRepoResource>{
    public async list() {
        const result = await (await this.API).post<{ result: Record<string, PluginRepoItem> }>("plugin/apps", { auth: true });
        return Object.entries(result.result).map(([key, value]) => ({ ...value, key }));
    }

    protected listHook(options?: any): Promise<PluginRepoItem[]> {
        return this.list();
    }

    public async install(id: PluginRepoItem['key']) {
        const result = await (await this.API).post("plugin/install",
            {
                auth: true,
                data: {
                    id: id
                }
            })
    }
}