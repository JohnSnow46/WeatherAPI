using WeatherMap.Domain.Models;

namespace WeatherMap.Domain.Abstractions;

// A single proxy abstraction for OpenWeatherMap's Weather Maps 1.0 tile
// layers (wind_new, clouds_new, precipitation_new, pressure_new, temp_new).
public interface IWeatherTileClient
{
    Task<MapTile> GetTileAsync(string layer, int z, int x, int y, CancellationToken cancellationToken);
}
