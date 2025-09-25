using Manu.AIAssist.WebApi.Models.Authentication;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Manu.AIAssist.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthenticationController : ControllerBase
    {
        [HttpPost]
        [Route("microsoft")]
        public IActionResult Microsoft(AuthenticationRequest request)
        {
            return Ok($"Microsoft authentication endpoint {request.Code} - {request.CodeVerifier}");
        }
    }
}
