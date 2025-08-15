"use client";
import React from "react";
import { SharedTabs } from "@/components/shared/shared-tabs";
import LoginForm from "@/components/login/login-form";
import { USER_ROLES } from "@/constants";
import type { TabItem } from "@/types/ui";

interface LoginTabsProps {
  className?: string;
}

export default function LoginTabs({ className = "" }: LoginTabsProps) {
  const tabs: TabItem[] = [
    {
      value: USER_ROLES.CUSTOMER,
      label: "Customer",
      content: <LoginForm isStaff={false} />,
    },
    {
      value: USER_ROLES.STAFF,
      label: "Staff",
      content: <LoginForm isStaff={true} />,
    },
  ];

  return (
    <SharedTabs
      tabs={tabs}
      defaultValue={USER_ROLES.CUSTOMER}
      className={className}
    />
  );
}
