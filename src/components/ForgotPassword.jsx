import React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button, Input, Logo } from "./index";
import { useForgotPasswordMutation } from "../features/auth/useAuthQueries";

function ForgotPassword() {
  const forgotPasswordMutation = useForgotPasswordMutation();
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const loading = forgotPasswordMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data) => {
    setError("");
    setMessage("");
    try {
      const response = await forgotPasswordMutation.mutateAsync({ email: data.email.trim() });
      setMessage(
        response?.message ||
          response?.data?.message ||
          "If an account exists for this email, a reset link has been sent."
      );
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to request password reset");
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
          Forgot your password?
        </h2>
        <p className="mt-2 text-center text-base text-dark/70 dark:text-dark/70">
          Enter your email and we will send a reset link.
        </p>

        {error && (
          <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
            <p className="text-warning font-medium text-sm">{error}</p>
          </div>
        )}

        {message && !error && (
          <div className="mt-4 p-3 bg-secondary/10 border border-secondary/30 rounded-lg">
            <p className="text-secondary font-medium text-sm">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
          <div className="space-y-5">
            <div>
              <Input
                label="Email:"
                placeholder="Enter your email"
                type="email"
                disabled={loading}
                {...register("email", {
                  required: "Email is required",
                  validate: {
                    matchPattern: (value) =>
                      /^([\w.\-_]+)?\w+@[\w-_]+(\.\w+){1,}$/.test(value) ||
                      "Enter valid email",
                  },
                })}
              />
              {errors.email && (
                <p className="text-warning text-xs mt-1 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white px-5 py-2 rounded-xl font-semibold hover:bg-secondary transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-primary hover:underline transition"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
