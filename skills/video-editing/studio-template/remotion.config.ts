import { Config } from "@remotion/cli/config";

// Master render: high-quality intermediate; finish.sh does loudness + platform encodes.
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCodec("h264");
Config.setCrf(16);
Config.setPixelFormat("yuv420p");
Config.setColorSpace("bt709");
Config.setConcurrency("50%");
