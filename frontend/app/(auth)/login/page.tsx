"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { AuthForm } from "@/components/custom/auth-form";
import { SubmitButton } from "@/components/custom/submit-button";

import { login, LoginActionState } from "../actions";

export default function Page() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [email, setEmail] = useState(process.env.NEXT_PUBLIC_DEFAULT_USER_EMAIL || "");

  const [state, formAction] = useActionState<LoginActionState, FormData>(login, {
    status: "idle",
  });

  useEffect(() => {
    if (state.status === "failed") {
      toast.error("Invalid credentials!");
    } else if (state.status === "invalid_data") {
      toast.error("Failed validating your submission!");
    } else if (state.status === "success" && !isRedirecting) {
      setIsRedirecting(true);
      updateSession()
        .then(() => {
          router.refresh()
        })
        .catch((error) => {
          console.error("Session update failed:", error);
          setIsRedirecting(false);
          toast.error("Failed to initialize session");
        });
    }
  }, [state.status, router, updateSession, isRedirecting]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Use your email and password to sign in</p>
        </div>
        <AuthForm
          action={handleSubmit}
          defaultEmail={email}
          defaultPassword={process.env.NEXT_PUBLIC_DEFAULT_USER_PASSWORD || ""}
        >
          <SubmitButton>Sign in</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Don't have an account? "}
            <Link href="/register" className="font-semibold text-gray-800 hover:underline dark:text-zinc-200">
              Sign up
            </Link>
            {" for free."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
