import { ImagePromptResponse } from "./useImagePrompt.types";

export interface ImageResponse {
    id: string;
    timestamp: string;
    imageData: ImageDataResponse;
    imagePrompt: ImagePromptResponse;
}

export interface ImageDataResponse {
    url: string;
    smallUrl: string;
    mediumUrl: string;
    largeUrl: string;
}

export interface ImagesResponse {
    images: ImageResponse[];
}