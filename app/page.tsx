import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role } = session.user as any;

  if (role === "admin") {
    redirect("/admin/dashboard");
  } else if (role === "counter_a") {
    redirect("/counter-a");
  } else if (role === "counter_b") {
    redirect("/counter-b");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center space-y-6 bg-white p-12 rounded-[2rem] border border-slate-200 shadow-2xl">
        <h1 className="text-4xl font-black text-black">Unrecognized Role</h1>
        <p className="text-slate-500 font-black text-xl">Your current role is: <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{role || "undefined"}</span></p>
        <Link href="/api/auth/signout" className="inline-block mt-4 text-white bg-red-600 hover:bg-red-700 px-8 py-3 rounded-2xl shadow-lg shadow-red-500/20 transition-all font-black">
          Log out and try again
        </Link>
      </div>
    </div>
  );
}
