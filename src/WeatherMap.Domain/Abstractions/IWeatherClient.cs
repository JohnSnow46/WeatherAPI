using WeatherMap.Domain.Models;

namespace WeatherMap.Domain.Abstractions;

public interface IWeatherClient
{
    Task<CurrentConditions> GetCurrentAsync(double latitude, double longitude, CancellationToken cancellationToken);

    Task<Forecast> GetForecastAsync(double latitude, double longitude, int days, CancellationToken cancellationToken);
}
