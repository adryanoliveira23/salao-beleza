import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      {
        source: "/agendar",
        destination: "/agendamento",
        permanent: true,
      },
      {
        source: "/agendar/:username",
        destination: "/agendamento/:username",
        permanent: true,
      },
      {
        source: "/metas",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/ia-consultora",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/checklist",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
