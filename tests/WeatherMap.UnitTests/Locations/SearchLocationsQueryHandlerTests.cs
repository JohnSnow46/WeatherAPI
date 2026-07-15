using Moq;
using WeatherMap.Application.Locations;
using WeatherMap.Domain.Abstractions;
using WeatherMap.Domain.Models;

namespace WeatherMap.UnitTests.Locations;

public class SearchLocationsQueryHandlerTests
{
    [Fact]
    public async Task Handle_MapsGeocodingResultsToDtos()
    {
        var geocodingClient = new Mock<IGeocodingClient>();
        geocodingClient
            .Setup(c => c.SearchAsync("Wroclaw", 5, It.IsAny<CancellationToken>()))
            .ReturnsAsync([new Location("Wrocław", "Poland", "Lower Silesia", 51.11, 17.03, "Europe/Warsaw")]);

        var handler = new SearchLocationsQueryHandler(geocodingClient.Object);

        var result = await handler.Handle(new SearchLocationsQuery("Wroclaw", 5), CancellationToken.None);

        var location = Assert.Single(result);
        Assert.Equal("Wrocław", location.Name);
        Assert.Equal("Poland", location.Country);
        Assert.Equal(51.11, location.Latitude);
        Assert.Equal(17.03, location.Longitude);
    }

    [Fact]
    public async Task Handle_ReturnsEmptyList_WhenNoResults()
    {
        var geocodingClient = new Mock<IGeocodingClient>();
        geocodingClient
            .Setup(c => c.SearchAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        var handler = new SearchLocationsQueryHandler(geocodingClient.Object);

        var result = await handler.Handle(new SearchLocationsQuery("Nonexistentville"), CancellationToken.None);

        Assert.Empty(result);
    }
}
