using MediatR;
using Microsoft.AspNetCore.Mvc;
using WeatherMap.Application.Common;
using WeatherMap.Application.Locations;

namespace WeatherMap.Api.Controllers;

[ApiController]
[Route("api/locations")]
public sealed class LocationsController(IMediator mediator) : ControllerBase
{
    [HttpGet("search")]
    public async Task<ActionResult<IReadOnlyList<LocationDto>>> Search(
        [FromQuery] string query,
        [FromQuery] int count = 5,
        CancellationToken cancellationToken = default)
    {
        var result = await mediator.Send(new SearchLocationsQuery(query, count), cancellationToken);
        return Ok(result);
    }
}
