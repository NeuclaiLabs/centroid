import { randomUUID } from 'crypto';

import { Client , S3Error } from "minio";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";

const FileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size should be less than 5MB",
    })
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "application/pdf"].includes(file.type),
      {
        message: "File type should be JPEG, PNG, or PDF",
      },
    ),
});

const BUCKET_NAME = "openastra";

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "XDxUIS38tdwhXhBHRdJS",
  secretKey: process.env.MINIO_SECRET_KEY || "dEyxnX1x991giIX6V4BCg6DSkh3UFlpdnMlpuq6d",
});


export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Check if the file is not an image and ensure it has a content type
    if (!["image/jpeg", "image/png"].includes(file.type) && !file.type) {
      return NextResponse.json({ error: "Non-image files must specify a content type" }, { status: 400 });
    }

    // Generate a unique filename
    const fileExtension = file.name.split('.').pop();
    const safeFilename = `${randomUUID()}.${fileExtension}`;

    const fileBuffer = await file.arrayBuffer();

    await minioClient.putObject(BUCKET_NAME, safeFilename, Buffer.from(fileBuffer));
    const fileUrl = `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}/${BUCKET_NAME}/${safeFilename}`;

    console.log("File uploaded successfully. URL:", fileUrl);
    return NextResponse.json({
      url: fileUrl,
      name: file.name,
      originalFilename: file.name,
      contentType: file.type
    });
  } catch (error) {
    console.error("Error in file upload:", error);
    if (error instanceof S3Error) {
      return NextResponse.json({ error: `MinIO S3 Error: ${error.message}`, code: error.code }, { status: 500 });
    }
    return NextResponse.json({ error: "Upload to MinIO failed" }, { status: 500 });
  }
}
