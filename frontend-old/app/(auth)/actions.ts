"use server";

import { z } from "zod";

import { signIn, signOut } from "./auth";

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
}

export const login = async (_: LoginActionState, formData: FormData): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};

export interface RegisterActionState {
  status: "idle" | "in_progress" | "success" | "failed" | "user_exists" | "invalid_data";
}

export const register = async (_: RegisterActionState, formData: FormData): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: validatedData.email,
        password: validatedData.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 400 && error.detail.includes("already exists")) {
        return { status: "user_exists" } as RegisterActionState;
      }
      return { status: "failed" } as RegisterActionState;
    }

    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: "success" } as RegisterActionState;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" } as RegisterActionState;
    }
    return { status: "failed" } as RegisterActionState;
  }
};

export async function handleSignOut() {
  await signOut({ redirectTo: "/" });
}
