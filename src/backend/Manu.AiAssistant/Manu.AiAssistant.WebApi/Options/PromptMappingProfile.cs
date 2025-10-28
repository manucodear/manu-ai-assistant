using AutoMapper;
using Manu.AiAssistant.WebApi.Models.Api;
using Manu.AiAssistant.WebApi.Models.Entities;

namespace Manu.AiAssistant.WebApi.Options
{
    public class PromptMappingProfile : Profile
    {
        public PromptMappingProfile()
        {
            // Entity -> DTO
            CreateMap<Tag, ImagePromptTags>();
            CreateMap<Prompt, ImagePromptResponse>()
                .ForMember(dest => dest.Tags, opt => opt.MapFrom(src => src.Tags));

            // DTO -> Entity
            CreateMap<ImagePromptTags, Tag>();
            CreateMap<ImagePromptResponse, Prompt>();
        }
    }
}
