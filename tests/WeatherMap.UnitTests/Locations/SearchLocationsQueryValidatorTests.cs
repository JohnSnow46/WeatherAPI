using WeatherMap.Application.Locations;

namespace WeatherMap.UnitTests.Locations;

public class SearchLocationsQueryValidatorTests
{
    private readonly SearchLocationsQueryValidator _validator = new();

    [Fact]
    public void Validate_Succeeds_ForValidQuery()
    {
        var result = _validator.Validate(new SearchLocationsQuery("Wroclaw", 5));

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Validate_Fails_ForEmptyQuery(string query)
    {
        var result = _validator.Validate(new SearchLocationsQuery(query));

        Assert.False(result.IsValid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(21)]
    public void Validate_Fails_ForCountOutOfRange(int count)
    {
        var result = _validator.Validate(new SearchLocationsQuery("Wroclaw", count));

        Assert.False(result.IsValid);
    }
}
