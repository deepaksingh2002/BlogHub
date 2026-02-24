import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../features/auth/authThunks";
import { Button, Input, Logo } from "./index";
import PasswordInput from "./PasswordInput";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";

function Signup() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

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

      //Register user
      const user = await dispatch(registerUser(signupData)).unwrap();
      console.log("REGESTER:: ",user);


      // Auto-login
      await dispatch(
        loginUser({
          email: data.email,
          password: data.password,
        })
      ).unwrap();

      // Redirect to home
      navigate("/");
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
    <div className="flex items-center justify-center w-full min-h-screen">
      <div className="mx-auto w-full max-w-lg bg-gray-100 rounded-xl p-10 m-10 border border-black/10 shadow-lg">
        <div className="mb-2 flex justify-center">
          <span className="inline-block w-full max-w-[100px]">
            <Logo width="100%" />
          </span>
        </div>

        <h2 className="text-center text-2xl font-bold leading-tight text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-base text-black/60">
          Already have an account?&nbsp;
          <Link
            to="/login"
            className="font-medium text-primary hover:underline transition"
          >
            Sign In
          </Link>
        </p>

        {serverError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-medium text-sm">{serverError}</p>
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
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
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
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
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
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
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
              <p className="text-red-500 text-xs mt-1">
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
