// "use client";

// import { redirect } from "next/navigation";

// export default function HomePage() {
//   // 서버 측에서 즉시 리다이렉트 수행
//   redirect("/dashboard");
// }

import { redirect } from "next/navigation";

export default function Dashboard() {
  redirect("/login");
}
