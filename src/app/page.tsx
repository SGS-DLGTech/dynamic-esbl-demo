import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Dynamic ESBL",
	description: "Dynamic conversation with eSBL",
};

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignIn routing="hash" fallbackRedirectUrl='/esbl-demo' />
      </div>
    </div>
  )
}
