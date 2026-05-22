import { Route } from "next";
import { redirect } from "next/navigation";

export default function LegacyEditPage() {
  redirect("/owner-shops/profile" as Route);
}
