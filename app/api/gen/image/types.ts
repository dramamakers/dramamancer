export interface SparkRequestPayload {
  meta: {
    user: { id: string; name: string };
    location: { channel_id: string };
    platform: string;
  };
  job_flags: { mode: string };
  service: string;
  prompt?: string;
  parameters?: {
    quality?: number;
    width?: number;
    height?: number;
  };
  /* Video generation */
  parent_job?: {
    job_id: string;
    image_num?: number;
  };
  new_prompt?: string;
  video_type?: string;
}

export interface SparkRequestInit extends RequestInit {
  method: string;
  protocol: string;
  hostname: string;
  path: string;
  headers: HeadersInit;
}
