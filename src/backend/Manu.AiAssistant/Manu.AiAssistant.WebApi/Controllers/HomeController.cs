using Microsoft.AspNetCore.Mvc;

namespace Manu.AiAssistant.WebApi.Controllers
{
    [Route("api/[controller]")]
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return Ok("Welcome to the API");
        }
    }
}
