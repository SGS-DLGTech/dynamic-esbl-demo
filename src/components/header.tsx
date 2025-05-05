'use client';

import { SignedIn, UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <header className="w-full px-6 py-4 bg-gray-100 border-b flex justify-between items-center">
      <SignedIn>
        <UserButton/>
      </SignedIn>
    </header>
  );
}
