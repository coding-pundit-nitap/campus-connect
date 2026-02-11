export const environment = {
  minioBaseUrl: `/api/images/${process.env.NEXT_PUBLIC_MINIO_BUCKET || "campus-connect"}`,
};
