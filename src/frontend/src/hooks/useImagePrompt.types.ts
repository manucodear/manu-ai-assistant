export interface ImagePromptGenerateRequest
{
    prompt: string;
    conversationId?: string;
    userImageUrl?: string;
}

export interface ImagePromptResponse
{
    id: string;
    originalPrompt: string;
    improvedPrompt: string;
    mainDifferences: string;
    tags: ImagePromptTagsResponse;
    pointOfViews: string[];
    pointOfView: string;
    imageStyles: string[];
    imageStyle: string;
    conversationId: string;
    imageId?: string;
    userImageUrl?: string;
}

export interface ImagePromptTagsResponse
{
    included: string[];
    notIncluded: string[];
}

export interface ImagePromptRevisionRequest
{
    prompt: string;
    revisionTags: RevisionTagsRequest;
    pointOfView: string;
    imageStyle: string;
}

export interface RevisionTagsRequest
{
    toInclude: string[];
    toExclude: string[];
}

export interface ImagePromptRevisionResponse
{
    revisedPrompt: string;
    summaryOfChanges: SummaryOfChangesResponse;
}

export interface SummaryOfChangesResponse
{
    pointOfViewAdjustment: string;
    clarity: string;
    grammarAndStyle: string;
    conceptsAdded: string;
    conceptsRemoved: string;
}