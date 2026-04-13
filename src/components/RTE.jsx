import React from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Controller } from "react-hook-form";

export default function RTE({ name = "content", control, label }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 font-medium text-dark dark:text-dark">
          {label}
        </label>
      )}

      <Controller
        name={name}
        control={control}
        defaultValue=""
        rules={{ required: true }}
        render={({ field }) => (
          <Editor
            apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
            value={field.value}
            onEditorChange={field.onChange}
            init={{
              height: 400,
              menubar: true,
              plugins:
                "anchor autolink charmap codesample emoticons image link lists media table visualblocks wordcount",
              toolbar:
                "undo redo | blocks | bold italic underline | bullist numlist | link image | removeformat",
            }}
          />
        )}
      />
    </div>
  );
}
