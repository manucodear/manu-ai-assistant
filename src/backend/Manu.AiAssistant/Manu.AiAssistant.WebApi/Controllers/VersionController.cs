using Manu.AiAssistant.WebApi.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Manu.AiAssistant.WebApi.Controllers
{
    [Route("api/[controller]")]
    public class VersionController : ControllerBase
    {
        private readonly AppOptions _appOptions;
        public VersionController(IOptions<AppOptions> appOptions)
        {
            _appOptions = appOptions.Value;
        }

        [HttpGet]
        public IActionResult GetVersion()
        {
            return Ok(new { version = _appOptions.Version } );
        }
    }
}
