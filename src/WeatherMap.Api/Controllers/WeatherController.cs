using MediatR;
using Microsoft.AspNetCore.Mvc;
using WeatherMap.Application.Common;
using WeatherMap.Application.Weather;

namespace WeatherMap.Api.Controllers;

[ApiController]
[Route("api/weather")]
public sealed class WeatherController(IMediator mediator) : ControllerBase
{
    [HttpGet("current")]
    public async Task<ActionResult<CurrentWeatherDto>> Current(
        [FromQuery] double lat,
        [FromQuery] double lon,
        CancellationToken cancellationToken = default)
    {
        var result = await mediator.Send(new GetCurrentWeatherQuery(lat, lon), cancellationToken);
        return Ok(result);
    }

    [HttpGet("forecast")]
    public async Task<ActionResult<ForecastDto>> Forecast(
        [FromQuery] double lat,
        [FromQuery] double lon,
        [FromQuery] int days = 7,
        CancellationToken cancellationToken = default)
    {
        var result = await mediator.Send(new GetForecastQuery(lat, lon, days), cancellationToken);
        return Ok(result);
    }
}
