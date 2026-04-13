import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Logo } from "./index";
import PasswordInput from "./PasswordInput";
import { useForm } from "react-hook-form";
import { getDashboardPathForUser } from "../utils/roleHelpers";
import { useBootstrapCurrentUserQuerySafe, useLoginMutation } from "../features/auth/useAuthQueries";

function Login() {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();
  const bootstrapQuery = useBootstrapCurrentUserQuerySafe(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      credential: "",
      password: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleLogin = async (data) => {
    setServerError("");
    setLoading(true);

    try {
      const credential = data.credential.trim();
      const isEmail = credential.includes("@");
      const loginPayload = {
        password: data.password,
        ...(isEmail ? { email: credential } : { username: credential }),
      };

      const loginResponse = await loginMutation.mutateAsync(loginPayload);

      // Start with the login payload, then try to hydrate from /currentUser.
      const loginUserPayload =
        loginResponse?.user ||
        loginResponse?.currentUser ||
        loginResponse?.loggedInUser ||
        loginResponse?.data?.user ||
        loginResponse?.data?.currentUser ||
        loginResponse?.data?.loggedInUser ||
        loginResponse?.data ||
        null;

      let effectiveUser = loginUserPayload;

      try {
        const currentUserResponse = await bootstrapQuery.refetch();
        const currentPayload = currentUserResponse?.data;
        effectiveUser =
          currentPayload?.user ||
          currentPayload?.currentUser ||
          currentPayload?.loggedInUser ||
          currentPayload?.data?.user ||
          currentPayload?.data?.currentUser ||
          currentPayload?.data?.loggedInUser ||
          currentPayload?.data ||
          effectiveUser;
      } catch {
        // If currentUser fails due missing refresh cookie/cross-site cookie policy,
        // keep the successful login flow using the login response payload.
      }

      navigate(getDashboardPathForUser(effectiveUser));
    } catch (error) {
      setServerError(
        typeof error === "string"
          ? error
          : error?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-background dark:bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-lg bg-light dark:bg-light rounded-xl p-10 m-10 border border-secondary/20 shadow-lg">
        <div className="mb-2 flex justify-center">
          <span className="inline-block w-full max-w-[100px]">
            <Logo width="100%" />
          </span>
        </div>
        <h2 className="text-center text-2xl font-bold leading-tight text-dark dark:text-dark">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-base text-dark/70 dark:text-dark/70">
          Create new account?&nbsp;
          <Link
            to="/signup"
            className="font-medium text-primary hover:underline transition"
          >
            Sign Up
          </Link>
        </p>
        {serverError && (
          <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
            <p className="text-warning font-medium text-sm">{serverError}</p>
          </div>
        )}
        <form onSubmit={handleSubmit(handleLogin)} className="mt-6">
          <div className="space-y-5">
            <div>
              <Input
                label="Email or Username:"
                placeholder="Enter your email or username"
                type="text"
                disabled={loading}
                {...register("credential", {
                  required: "Email or username is required",
                  validate: {
                    isValidCredential: (value) => {
                      const trimmed = value.trim();
                      if (!trimmed) return "Email or username is required";
                      if (!trimmed.includes("@")) return true;
                      return /^([^\s@]+)@([^\s@]+)\.([^\s@]+)$/.test(trimmed)
                        ? true
                        : "Enter a valid email";
                    },
                  },
                })}
              />
              {errors.credential && (
                <p className="text-warning text-xs mt-1 font-medium">
                  {errors.credential.message}
                </p>
              )}
            </div>
            <div>
              <PasswordInput
                label="Password:"
                placeholder="Enter your password"
                disabled={loading}
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
              />
              {errors.password && (
                <p className="text-warning text-xs mt-1 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white px-5 py-2 rounded-xl font-semibold hover:bg-secondary transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline transition"
              >
                Forgot password?
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
