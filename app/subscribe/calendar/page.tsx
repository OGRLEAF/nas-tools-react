import { Section } from "@/app/components/Section";
import { Calendar } from "antd";
import React from "react";

export default function SubscribeCalendar() {
    return <Section title="订阅日历">
        <Calendar />
    </Section>
}