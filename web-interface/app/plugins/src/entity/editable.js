const User = ( function() { // eslint-disable-line no-unused-vars

  /**
   * V Plugin driving the entity edit page
   *
   */

  'use strict';

  /* ================== private methods ================= */

  async function presenter( which ) {

    if ( which == '/me/disconnect' ) {
      return which;
    }

    const aE = V.getState( 'activeEntity' );

    if ( !aE ) {
      return {
        success: false,
        status: ''
      };
    }
    else {
      return {
        success: true,
        status: 'active entity retrieved',
        data: [{
          which: which,
          entity: V.getState( 'activeEntity' ),
          mapData: [
            {
              type: 'Feature',
              geometry: aE.geometry,
              profile: aE.profile,
              thumbnail: aE.thumbnail,
              path: aE.path
            }
          ]
        }]
      };
    }
  }

  function view( data ) {

    if ( data == '/me/disconnect' ) {
      Modal.draw( 'disconnect' );
      return;
    }

    let $topcontent, $list;

    if ( data.success ) {
      UserComponents.setData( {
        entity: data.data[0].entity,
        editable: true
      } );

      $list = CanvasComponents.list( 'narrow' );
      $topcontent = UserComponents.topcontent();

      V.setNode( $list, [
        InteractionComponents.onboardingCard(),
        UserComponents.entityCard(),
        UserComponents.socialCard(),
        UserComponents.addOrChangeImage(),
        UserComponents.descriptionCard(),
        UserComponents.locationCard(),
        UserComponents.preferredLangsCard(),
        UserComponents.financialCard(),
        UserComponents.evmAddressCard(),
        UserComponents.evmReceiverAddressCard(),
        UserComponents.uPhraseCard(),
      ] );

      Navigation.draw( data.data[0].which );

      Page.draw( {
        topcontent: $topcontent,
        listings: $list,
        position: 'top',
      } ).then( () => {
        Google.launch().then( () => { // adds places lib script
          Google.initAutocomplete( 'user' );
        } );
      } );

      // Chat.drawMessageForm( 'clear' );

      VMap.draw( data.data[0].mapData );
    }
    else if ( data.success === null ) {
      Page.draw( {
        topcontent: CanvasComponents.notFound( 'entity' ),
      } );
    }
    else {
      Marketplace.draw();
    }
  }

  /* ============ public methods and exports ============ */

  function launch() {
    V.setNavItem( 'userNav', [
      {
        title: 'Transfers',
        path: '/me/transfers',
        use: {
          button: 'search',
        },
        draw: function( path ) {
          Account.draw( path );
        }
      },
      {
        title: 'Profile',
        path: '/me/profile',
        use: {
          button: 'plus search',
        },
        draw: function( path ) {
          User.draw( path );
        }
      },
      {
        title: 'Settings',
        path: '/me/settings',
        use: {
          button: 'plus search',
        },
        draw: function( path ) {
          Settings.draw( path );
        }
      },
      {
        title: 'Entities',
        path: '/me/entities',
        use: {
          button: 'plus search',
        },
        draw: function( path ) {
          EntityList.draw( path );
        }
      },
      {
        title: 'Disconnect',
        path: '/me/disconnect',
        draw: function( path ) {
          User.draw( path );
        }
      }
    ] );
  }

  function draw( which ) {
    presenter( which ).then( data => { view( data ) } );
  }

  return {
    draw: draw,
    launch: launch
  };

} )();
