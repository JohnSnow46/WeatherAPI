using WeatherMap.Domain.Models;

namespace WeatherMap.Application.Common;

public static class Mapping
{
    public static LocationDto ToDto(this Location location) =>
        new(location.Name, location.Country, location.Admin1, location.Latitude, location.Longitude, location.Timezone);

    public static CurrentWeatherDto ToDto(this CurrentConditions current) =>
        new(current.Time, current.TemperatureC, current.ApparentTemperatureC, current.WindSpeedKmh,
            current.WindDirectionDeg, current.PrecipitationMm, current.WeatherCode, current.IsDay);

    public static HourlyForecastPointDto ToDto(this HourlyForecastPoint point) =>
        new(point.Time, point.TemperatureC, point.PrecipitationMm, point.WindSpeedKmh, point.WeatherCode);

    public static DailyForecastPointDto ToDto(this DailyForecastPoint point) =>
        new(point.Date, point.TempMaxC, point.TempMinC, point.PrecipitationSumMm, point.WeatherCode);

    public static ForecastDto ToDto(this Forecast forecast) =>
        new(forecast.Hourly.Select(ToDto).ToList(), forecast.Daily.Select(ToDto).ToList());

    public static RadarFrameDto ToDto(this RadarFrame frame) =>
        new(frame.Time, frame.Path);

    public static RadarInfoDto ToDto(this RadarInfo info) =>
        new(info.Host, info.Past.Select(ToDto).ToList(), info.Nowcast.Select(ToDto).ToList());

    public static MapTileDto ToDto(this MapTile tile) =>
        new(tile.Content, tile.ContentType);
}
