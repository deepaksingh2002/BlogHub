import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Logo } from "./index";
import PasswordInput from "./PasswordInput";
import { useForm } from "react-hook-form";
import { getDashboardPathForUser } from "../utils/roleHelpers";
import { useBootstrapCurrentUserQuery, useSignupMutation } from "../features/auth/useAuthQueries";

function Signup() {
  const navigate = useNavigate();
  const signupMutation = useSignupMutation();
  const bootstrapQuery = useBootstrapCurrentUserQuery(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const password = watch("password");

  const handleSignup = async (data) => {
    setServerError("");
    setLoading(true);

    try {
      const signupData = {
        fullName: data.name.trim(),
        email: data.email.trim(),
        password: data.password.trim(),
      };

      // Register user
      const signupResponse = await signupMutation.mutateAsync(signupData);

      // Hydrate user with full profile/role info
      const currentUserResponse = await bootstrapQuery.refetch();
      const currentPayload = currentUserResponse?.data;
      
      // Extract user from the getCurrentUser response - this now has full role info
      const user =
        currentPayload?.user ||
        currentPayload?.currentUser ||
        currentPayload?.loggedInUser ||
        currentPayload?.data?.user ||
        currentPayload?.data?.currentUser ||
        currentPayload?.data?.loggedInUser ||
        currentPayload?.data ||
        signupResponse?.user ||
        signupResponse?.data?.user ||
        null;

      navigate(getDashboardPathForUser(user));
    } catch (error) {
      setServerError(
        typeof error === "string"
          ? error
          : error?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-background dark:bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-lg bg-light dark:bg-light rounded-xl p-10 m-10 border border-secondary/20 shadow-lg transition-colors">
        <div className="mb-2 flex justify-center">
          <span className="inline-block w-full max-w-[100px]">
            <Logo width="100%" />
          </span>
        </div>

        <h2 className="text-center text-2xl font-bold leading-tight text-dark dark:text-dark">
          Create your account
        </h2>
        <p className="mt-2 text-center text-base text-dark/70 dark:text-dark/70">
          Already have an account?&nbsp;
          <Link
            to="/login"
            className="font-medium text-primary hover:underline transition"
          >
            Sign In
          </Link>
        </p>

        {serverError && (
          <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
            <p className="text-warning font-medium text-sm">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(handleSignup)} className="mt-6">
          <div className="space-y-5">
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              disabled={loading}
              {...register("name", {
                required: "Full name is required",
                minLength: { value: 3, message: "Minimum 3 characters" },
              })}
            />
            {errors.name && (
              <p className="text-warning text-xs mt-1">{errors.name.message}</p>
            )}

            <Input
              label="Email"
              placeholder="Enter your email"
              disabled={loading}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
                  message: "Enter a valid email",
                },
              })}
            />
            {errors.email && (
              <p className="text-warning text-xs mt-1">{errors.email.message}</p>
            )}

            <PasswordInput
              label="Password"
              placeholder="Enter password"
              disabled={loading}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Min 6 characters" },
              })}
            />
            {errors.password && (
              <p className="text-warning text-xs mt-1">{errors.password.message}</p>
            )}

            <PasswordInput
              label="Confirm Password"
              placeholder="Re-enter password"
              disabled={loading}
              {...register("confirmPassword", {
                required: "Confirm password",
                validate: (value) => value === password || "Passwords do not match",
              })}
            />
            {errors.confirmPassword && (
              <p className="text-warning text-xs mt-1">
                {errors.confirmPassword.message}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white px-5 py-2 rounded-xl font-semibold hover:bg-secondary transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;
