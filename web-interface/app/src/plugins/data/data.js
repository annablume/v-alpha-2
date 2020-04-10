const Data = ( function() { // eslint-disable-line no-unused-vars

  /**
   * Module for data display
   *
   */

  'use strict';

  V.setNavItem( 'serviceNav', [
    {
      title: 'Data',
      role: 'data',
      use: {
        button: 'search',
        form: 'new entity'
      },
      draw: function() { Data.draw() }
    }
  ] );

  /* ================== private methods ================= */

  async function presenter( options ) {

    const geometry = V.getState( 'map' ); // || { lat: 52.522, lng: 13.383, zoom: 12 };
    // const geometry = { lat: 52.3667, lng: 4.8945, zoom: 12 }; // Amsterdam

    // const apiKeyAir = '43efc70f-a3e2-4cc3-a261-fb5bd47a3e1c';
    const apiKeyWeather = '8cc2a6452c40044763dd503c9752fbdc';

    // const co2 = await Promise.resolve( getHttp( 'https://datahub.io/core/co2-ppm-daily/datapackage.json' ) );
    // const a = Promise.resolve( V.getHttp( 'https://api.airvisual.com/v2/nearest_city?lat=' + geometry.lat.toFixed( 4 ) + '&lon=' + geometry.lng.toFixed( 4 ) + '&key=' + apiKeyAir ) );
    const b = Promise.resolve( V.getData( 'https://api.openweathermap.org/data/2.5/weather?lat=' + geometry.lat.toFixed( 4 ) + '&lon=' + geometry.lng.toFixed( 4 ) + '&appid=' + apiKeyWeather, '', 'http' ) );
    const c = Promise.resolve( V.getData( 'https://api.openweathermap.org/data/2.5/forecast?lat=' + geometry.lat.toFixed( 4 ) + '&lon=' + geometry.lng.toFixed( 4 ) + '&appid=' + apiKeyWeather, '', 'http' ) );

    const all = await Promise.all( [{ status: 'fail' }, b, c] );

    const airQuality = all[0];
    const weatherData = all[1];
    const forecastData = all[2];

    let formattedAirQualityData = {
      city: 'Sorry, could not get data',
      pollution: 0
    };

    if ( airQuality && airQuality.status != 'fail' ) {
      formattedAirQualityData = {
        city: 'The current air pollution levels in ' + airQuality.data.city + '!',
        pollution: airQuality.data.current.pollution
      };
    }

    const formattedWeatherDataNow = {
      place: 'The weather in ' + ( weatherData.name == '' ? 'current map position' : weatherData.name ) + '!',
      iconUrl: 'http://openweathermap.org/img/wn/' + weatherData.weather[0].icon + '@2x.png',
      temp: 'Temperature: ' + ( weatherData.main.temp - 273.15 ).toFixed( 1 ) + '°C / ' +
             ( ( weatherData.main.temp - 273.15 ) * 9/5 + 32 ).toFixed( 1 ) + '°F',
      tempC: ( weatherData.main.temp - 273.15 ).toFixed( 0 ) + '°C',
      humidity: 'Humidity: ' + weatherData.main.humidity,
      sky: weatherData.weather[0].description,
      sunrise: 'Sunrise: ' + '<object type="image/svg+xml" data="001-sunrise.svg"></object>' + new Date( weatherData.sys.sunrise ),
      sunset: 'Sunset: ' + new Date( weatherData.sys.sunset )
    };

    const formattedWeatherDataForecast = {
      date: {
        hr24: V.castTime( forecastData.list[8].dt * 1000, 'D MMM' ),
        hr48: V.castTime( forecastData.list[16].dt * 1000, 'D MMM' ),
        hr72: V.castTime( forecastData.list[24].dt * 1000, 'D MMM' ),
        hr96: V.castTime( forecastData.list[32].dt * 1000, 'D MMM' )
      },
      tempC: {
        hr24: ( forecastData.list[8].main.temp - 273.15 ).toFixed( 0 ) + '°C',
        hr48: ( forecastData.list[16].main.temp - 273.15 ).toFixed( 0 ) + '°C',
        hr72: ( forecastData.list[24].main.temp - 273.15 ).toFixed( 0 ) + '°C',
        hr96: ( forecastData.list[32].main.temp - 273.15 ).toFixed( 0 ) + '°C',
      },
      iconUrl: {
        hr24: 'http://openweathermap.org/img/wn/' + forecastData.list[8].weather[0].icon + '@2x.png',
        hr48: 'http://openweathermap.org/img/wn/' + forecastData.list[16].weather[0].icon + '@2x.png',
        hr72: 'http://openweathermap.org/img/wn/' + forecastData.list[24].weather[0].icon + '@2x.png',
        hr96: 'http://openweathermap.org/img/wn/' + forecastData.list[32].weather[0].icon + '@2x.png'
      }
    };

    const $listingsUl = DataComponents.listingsUl();
    const $weatherCard = DataComponents.weatherCard( formattedWeatherDataNow, formattedWeatherDataForecast );
    // const $airCard = DataComponents.airCard( formattedAirQualityData );

    V.setNode( $listingsUl, $weatherCard );
    // V.setNode( $listingsUl, $airCard );

    const pageData = {
      listings: $listingsUl,
      position: 'top'
    };

    return pageData;
  }

  function view( pageData ) {
    Page.draw( pageData );
  }

  /* ============ public methods and exports ============ */

  function draw( options ) {
    presenter( options ).then( viewData => { view( viewData ) } );
  }

  return {
    draw: draw,
  };

} )();
