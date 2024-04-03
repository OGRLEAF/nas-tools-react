import { Modal, Form, FormProps } from "antd";
import { useForm } from "antd/es/form/Form";
import { useSubmitMessage } from "../utils";
import { UnionPathsSelectGroup, EmptyPathSelect, DownloadPathSelect, StringPathInput } from "./LibraryPathSelector";
import { DownloadSettingSelect } from "./NTSelects";
import { ForwardedRef, forwardRef, useImperativeHandle } from "react";


export interface DownloadSettingForm {
    setting: number,
    path?: string,
}

export type DownloadFormAction = {
    getSetting: () => DownloadSettingForm
}
export function _TorrentDownloadForm({
    layout,
    onChange,
}: {
    layout?: FormProps['layout'],
    onChange?: (values: DownloadSettingForm) => void
},
    ref: ForwardedRef<DownloadFormAction>
) {
    const [form] = useForm();

    useImperativeHandle(ref, () => ({
        getSetting: () => {
            return form.getFieldsValue();
        }
    }))
    return <Form<DownloadSettingForm>
        form={form} initialValues={{ setting: 0, path: undefined }} layout={layout ?? "horizontal"}
        onChange={(values) => {
            onChange?.(form.getFieldsValue())
        }}
    >
        <Form.Item name="setting" label="下载设置" style={{ marginTop: 12, marginBottom: 16 }}>
            <DownloadSettingSelect style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="path" label="下载路径" style={{ marginBottom: 4 }}>
            <UnionPathsSelectGroup fallback="customize">
                <EmptyPathSelect key="auto" label="自动" />
                <DownloadPathSelect key="download" label="下载器目录" />
                <StringPathInput key="customize" label="自定义目录" />
            </UnionPathsSelectGroup>
        </Form.Item>
    </Form>
}



export const TorrentDownloadForm = forwardRef(_TorrentDownloadForm,)