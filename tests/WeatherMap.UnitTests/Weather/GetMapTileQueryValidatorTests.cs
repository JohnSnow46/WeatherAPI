using WeatherMap.Application.Weather;

namespace WeatherMap.UnitTests.Weather;

public class GetMapTileQueryValidatorTests
{
    private readonly GetMapTileQueryValidator _validator = new();

    [Theory]
    [InlineData("wind_new")]
    [InlineData("clouds_new")]
    [InlineData("precipitation_new")]
    [InlineData("pressure_new")]
    [InlineData("temp_new")]
    public void Validate_Succeeds_ForAllowedLayers(string layer)
    {
        var result = _validator.Validate(new GetMapTileQuery(layer, 5, 17, 10));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_Fails_ForUnknownLayer()
    {
        var result = _validator.Validate(new GetMapTileQuery("not_a_real_layer", 5, 17, 10));

        Assert.False(result.IsValid);
    }

    [Theory]
    [InlineData(-1, 0, 0)]
    [InlineData(20, 0, 0)]
    [InlineData(5, -1, 0)]
    [InlineData(5, 0, -1)]
    public void Validate_Fails_ForInvalidTileCoordinates(int z, int x, int y)
    {
        var result = _validator.Validate(new GetMapTileQuery("wind_new", z, x, y));

        Assert.False(result.IsValid);
    }
}
