/** @type {import('next').NextConfig} */
const nextConfig = {
  // SkinCart API routes proxy image bytes to the YouCam API; keep request
  // bodies roomy enough for a resized selfie (max ~1600px JPEG, well under 10MB).
  experimental: {
    serverActions: {
      bodySizeLimit: '12mb',
    },
  },
};

export default nextConfig;
