using AutoMapper;
using Manu.AiAssistant.WebApi.Models.Entities;
using Manu.AiAssistant.WebApi.Models.ImagePrompt;

namespace Manu.AiAssistant.WebApi.Options
{
    public class PromptMappingProfile : Profile
    {
        public PromptMappingProfile()
        {
            CreateMap<ImagePromptTags, Tag>();
            CreateMap<ImagePromptResult, Prompt>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.Username, opt => opt.Ignore());
        }
    }
}
