const Marketplace = ( function() { // eslint-disable-line no-unused-vars

  /**
   * Module driving the Marketplace
   *
   *
   */

  'use strict';

  V.setNavItem( 'serviceNav', [
    {
      title: 'Marketplace',
      use: {
        button: 'search',
      },
      draw: function() { Marketplace.draw() }
    },
    {
      title: 'Jobs',
      role: 'job',
      use: {
        button: 'plus search',
        form: 'new entity'
      },
      draw: function() {  Marketplace.draw( 'job' ) }
    },
    {
      title: 'Skills',
      role: 'skill',
      use: {
        button: 'plus search',
        form: 'new entity'
      },
      draw: function() {  Marketplace.draw( 'skill' ) }
    },
    {
      title: 'Events',
      role: 'event',
      use: {
        button: 'plus search',
        form: 'new entity'
      },
      draw: function() {  Marketplace.draw( 'event' ) }
    }
  ] );

  /* ================== private methods ================= */

  async function presenter( which ) {

    const mapData = [];

    const $slider = CanvasComponents.slider();
    const $list = CanvasComponents.list();

    const entities = await V.getEntity( which );

    if ( entities.data ) {
      entities.data.reverse().forEach( cardData => {
        mapData.push( { type: 'Feature', geometry: cardData.geometry } );
        const $smallcard = MarketplaceComponents.entitiesSmallCard( cardData );
        const $card = MarketplaceComponents.entitiesCard( cardData );
        V.setNode( $slider, $smallcard );
        V.setNode( $list, $card );
      } );
    }
    else {
      V.setNode( $slider, {
        t: 'p',
        h: 'No entities found'
      } );

    }

    return {
      mapData: mapData,
      pageData: {
        topslider: $slider,
        listings: $list,
        position: 'peek',
      }
    };
  }

  function view( data ) {
    Page.draw( data.pageData );
    VMap.draw( data.mapData );
  }

  /* ============ public methods and exports ============ */

  function draw( which ) {
    presenter( which ).then( viewData => { view( viewData ) } );
  }

  return {
    draw: draw,
  };

} )();
