using WeatherMap.Application.Common;
using WeatherMap.Application.Weather;

namespace WeatherMap.UnitTests.Weather;

public class GetCurrentWeatherBatchQueryValidatorTests
{
    private readonly GetCurrentWeatherBatchQueryValidator _validator = new();

    [Fact]
    public void Validate_Succeeds_ForOneOrMoreValidLocations()
    {
        var result = _validator.Validate(new GetCurrentWeatherBatchQuery(
            [new CoordinatesDto(51.11, 17.03), new CoordinatesDto(52.23, 21.01)]));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_Fails_ForNullLocations()
    {
        var result = _validator.Validate(new GetCurrentWeatherBatchQuery(null));

        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_Fails_ForEmptyLocations()
    {
        var result = _validator.Validate(new GetCurrentWeatherBatchQuery([]));

        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_Fails_WhenLocationCountExceedsMax()
    {
        var locations = Enumerable.Range(0, GetCurrentWeatherBatchQueryValidator.MaxLocations + 1)
            .Select(i => new CoordinatesDto(i, i))
            .ToArray();

        var result = _validator.Validate(new GetCurrentWeatherBatchQuery(locations));

        Assert.False(result.IsValid);
    }

    [Theory]
    [InlineData(-90.1, 0)]
    [InlineData(90.1, 0)]
    [InlineData(0, -180.1)]
    [InlineData(0, 180.1)]
    public void Validate_Fails_WhenAnyLocationIsOutOfRange(double lat, double lon)
    {
        var result = _validator.Validate(new GetCurrentWeatherBatchQuery(
            [new CoordinatesDto(51.11, 17.03), new CoordinatesDto(lat, lon)]));

        Assert.False(result.IsValid);
    }
}
