import { Conversation} from '@/components/conversation';
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Dynamic ESBL",
	description: "Dynamic conversation with eSBL",
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          EngageSBL Dynamic Scenario Demo
        </h1>
        <Conversation />
      </div>
    </main>
  );
}
