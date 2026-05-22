import { redirect } from "next/navigation";

import { authUtils } from "@/lib/utils/auth.utils.server";
import CreateShop from "@/page-components/create-shop";

export default async function Page() {
  let user = null;
  try {
    user = await authUtils.getUserData();
  } catch {
    user = null;
  }

  if (user?.shop_id) {
    redirect("/owner-shops");
  }

  return <CreateShop />;
}
