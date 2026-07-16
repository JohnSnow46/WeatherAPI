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

    [HttpGet("radar-tiles")]
    public async Task<ActionResult<RadarInfoDto>> RadarTiles(CancellationToken cancellationToken = default)
    {
        var result = await mediator.Send(new GetRadarInfoQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("map-tiles/{layer}/{z:int}/{x:int}/{y:int}")]
    public async Task<IActionResult> MapTiles(string layer, int z, int x, int y, CancellationToken cancellationToken = default)
    {
        var result = await mediator.Send(new GetMapTileQuery(layer, z, x, y), cancellationToken);
        return File(result.Content, result.ContentType);
    }
}
