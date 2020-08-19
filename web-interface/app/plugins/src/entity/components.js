const UserComponents = ( function() { // eslint-disable-line no-unused-vars

  /**
   * Components for V User Plugin (display user's tx history and editable profile)
   *
   */

  'use strict';

  let entity, editable;

  const DOM = {};

  V.setStyle( {
    'app-lang-selector': {
      'display': 'flex',
      'justify-content': 'space-evenly',
      'width': '190px',
      'padding': '25px 0'
    },
    'pool__funding-pie': {
      'stroke-width': '50',
      'fill': '#ddd',
      'stroke': 'rgb(65, 183, 135)'
    },
    'pool__funding-chart': {
      'margin': '23px 0 0 4px',
      'transform': 'rotate(-90deg)',
      'border-radius': '50%',
      'display': 'block',
      'background': '#ddd',
    },
    'pool__spending-pie': {
      'stroke-width': '50',
      'fill': '#ddd',
      'stroke': 'rgb(99, 82, 185)'
    },
    'pool__spending-chart': {
      'margin': '23px 0 0 4px',
      'transform': 'rotate(-90deg)',
      'border-radius': '50%',
      'display': 'block',
      'background': '#ddd',
    }
  } );

  /* ============== user interface strings ============== */

  const ui = {
    edit: 'edit',
    invalid: 'not valid',
    chgImg: 'Change this image',
    baseLoc: 'base location',
    currLoc: 'current location',
    UTCOffset: 'current UTC offset',
    notFunded: 'Not yet successfully funded',
    successFunded: 'Successfully funded',
    noneSpent: 'None yet spent',
    spent: 'Budget spent',

    description: 'Description',
    prefLang: 'Preferred Languages',
    lang: 'App Language',
    uPhrase: 'Entity Management Key',
    ethAddress: 'Entity Ethereum Address',
    ethAddressReceiver: 'Receiving Ethereum Address',
    loc: 'Location',
    entity: 'Entity',
    fin: 'Financial',
    social: 'Social',
    funding: 'Funding Status',
    img: 'Image'
  };

  function getString( string, scope ) {
    return V.i18n( string, 'profile', scope || 'profile cards content' ) + ' ';
  }

  /* ================== event handlers ================== */

  function handleEntryFocus() {
    DOM.entry = this.value ? this.value : this.innerHTML;
    if ( [getString( ui.edit ), getString( ui.invalid )].includes( DOM.entry )  ) {
      this.innerHTML = '';
      this.value = '';
    }
  }

  function handleViewKeyFocus( e ) {
    if ( this.type === 'password' ) {
      this.type = 'text';
      this.previousSibling.innerHTML = '';
      setTimeout( function() {
        e.target.setSelectionRange( 0, 9999 );
      }, 50 );
    }
    else {
      const selection = window.getSelection();
      selection.removeAllRanges();
      this.previousSibling.innerHTML = this.value.length > 18 ? '0x' : this.value.length ? 'vx' : '';
      this.type = 'password';
    }
  }

  function handleEntry() {
    let str, entry;
    this.value ? str = this.value : str = this.innerHTML;
    str = V.stripHtml( str );
    const title = this.getAttribute( 'title' );
    const db = this.getAttribute( 'db' );

    if ( str != DOM.entry ) {
      if ( str == '' ) {
        this.innerHTML = getString( ui.edit );
        setField( db + '.' + title, '' );
        return;
      }

      if ( ['facebook', 'twitter', 'telegram'].includes( title ) ) {
        str = str.endsWith( '/' ) ? str.slice( 0, -1 ) : str;
        const split = str.split( '/' );
        entry = split.pop().replace( '@', '' );
      }
      else if ( title == 'email' ) {
        entry = str.includes( '@' ) ? str.includes( '.' ) ? str : getString( ui.invalid ) : str == '' ? '' : getString( ui.invalid );
      }
      else if ( title == 'website' ) {
        entry = str.includes( '.' ) ? str : getString( ui.invalid );
      }
      else if ( ['address', 'evm'].includes( title ) ) {
        entry = str.includes( '0x' ) && str.length == 42 ? str : getString( ui.invalid );
      }
      else if ( title == 'currentUTC' ) {
        entry = isNaN( str ) ? getString( ui.invalid ) : str;
      }
      else if ( title == 'description' ) {
        entry = str.length > 2000 ? getString( ui.invalid ) : str;
      }
      else {
        entry = str;
      }

      if ( entry == getString( ui.invalid ) ) {
        this.innerHTML = getString( ui.invalid );
        return;
      }
      else {
        this.innerHTML = entry;
      }
      setField( db + '.' + title, entry );
    }
  }

  function handleBaseLocationFocus() {
    DOM.location = this.value;
  }

  function handleBaseLocation() {
    const lat = this.getAttribute( 'lat' );
    const lng = this.getAttribute( 'lng' );
    const value = this.value;
    V.getNode( '.location__curr' ).value = this.value;

    if ( DOM.location.length && value == '' ) {
      const gen = V.castRandLatLng();
      setField( 'properties.baseLocation', {
        lat: gen.lat,
        lng: gen.lng,
        value: undefined,
        rand: true
      } );
    }
    else if ( lat ) {
      setField( 'properties.baseLocation', {
        lat: lat,
        lng: lng,
        value: value,
        rand: false
      } );
      // delete lat and lng in order for "if" to work
      this.removeAttribute( 'lat' );
      this.removeAttribute( 'lng' );
    }
  }

  function handleRadioEntry() {
    const title = this.getAttribute( 'title' );
    const db = this.getAttribute( 'db' );
    const entry = this.getAttribute( 'value' );
    setField( db + '.' + title, entry );
  }

  function handleImageUpload( e ) {
    V.castImageUpload( e ).then( res => {
      if ( res.success ) {
        const fullId = V.aE().fullId;
        const auth = V.getCookie( 'last-active-uphrase' ).replace( /"/g, '' );
        const imageUpload = V.getState( 'imageUpload' );
        const tinyImageUpload = V.getState( 'tinyImageUpload' );
        Object.assign( imageUpload, { entity: fullId } );
        Object.assign( tinyImageUpload, { entity: fullId } );
        V.setEntity( fullId, {
          field: 'thumbnail',
          data: imageUpload,
          auth: auth
        } ).then( () => {
          V.setEntity( fullId, {
            field: 'tinyImage',
            data: tinyImageUpload,
            auth: auth
          } );
          V.setNode( '#img-upload-profile__label', getString( ui.chgImg ) );
          V.setNode( '#img-upload-profile__preview', '' );
          V.setNode( '#img-upload-profile__preview', V.cN( {
            t: 'img',
            y: {
              'max-width': '100%'
            },
            src: res.src
          } ) );
        } );
      }
    } );
  }

  /* ================== private methods ================= */

  function castCard( $innerContent, whichTitle ) {
    return CanvasComponents.card( $innerContent, whichTitle );
  }

  function castTableNode( titles, db, editable, css ) {
    const $table = V.cN( {
      t: 'table',
      c: 'w-full pxy',
      h: titles.map( title => {
        const inner = entity[db] ? entity[db][title] : undefined;

        const leftTd = {
          t: 'td',
          c: 'capitalize',
          h: getString( title )
        };

        const editTd = setEditable( {
          t: 'td',
          c: 'txt-right',
          a: { title: title, db: db },
          h: inner
        } );

        const noEditTd = {
          t: 'td',
          c: 'txt-right' + ( css ? ' ' + css : '' ),
          h: inner
        };

        let $row = V.cN( {
          t: 'tr',
          h: [
            leftTd,
            editable ? editTd : noEditTd,
          ]
        } );

        if ( !inner ) {
          $row = editable ? V.cN( {
            t: 'tr',
            h: [
              leftTd,
              editTd
            ]
          } ) : '';
        }

        return $row;

      } ).filter( item => {return item != ''} )
    } );

    return $table.firstChild ? $table : null;
  }

  function setEditable( obj ) {
    obj.e = {
      focus: handleEntryFocus,
      blur: handleEntry
    };
    if ( obj.a ) {
      Object.assign( obj.a, { contenteditable: 'true' } );
    }
    else {
      obj.a = { contenteditable: 'true' };
    }
    if ( !obj.h ) {
      obj.h = getString( ui.edit );
    }
    return obj;
  }

  function setField( field, data ) {
    V.setEntity( V.aE().fullId, {
      field: field,
      data: data,
      auth: V.getCookie( 'last-active-uphrase' ).replace( /"/g, '' )
    } );
  }

  /* ================== public methods ================== */

  function setData( data ) {
    entity = data.entity;
    editable = data.editable ? true : false;
  }

  function castUphraseNode( phrase, css = '' ) {
    return V.cN( {
      t: 'div',
      c: 'pxy ' + css,
      h: [
        { t: 'span', h: phrase.length > 18 ? '0x' : phrase.length ? 'vx' : '' },
        {
          t: 'input',
          c: css,
          a: {
            value: phrase,
            type: 'password',
          },
          y: {
            width: '190px',
            padding: 0
          },
          e: {
            focus: handleViewKeyFocus,
            blur: handleViewKeyFocus,
          }
        }
      ]
    } );

  }

  function topcontent() {
    return V.cN( {
      t: 'div',
      h: {
        tag: 'h1',
        class: 'font-bold txt-center pxy',
        html: entity.fullId,
      }
    } );
  }

  function descriptionCard() {
    const descr = entity.properties ? entity.properties.description : undefined;

    if( descr || ( !descr && editable ) ) {
      const $innerContent = V.cN( editable ? {
        t: 'textarea',
        c: 'w-full pxy',
        a: { rows: '6', title: 'description', db: 'properties' },
        e: {
          focus: handleEntryFocus,
          blur: handleEntry
        },
        h: descr ? descr : getString( ui.edit ),
      } : {
        t: 'div',
        c: 'pxy',
        h: V.castLinks( descr.replace( /\n/g, ' <br>' ) ).iframes,
      } );
      return castCard( $innerContent, getString( ui.description ) );
    }
    else {
      return '';
    }
  }

  function preferredLangsCard() {
    const langs = entity.properties ? entity.properties.preferredLangs : undefined;

    if( langs || ( !langs && editable ) ) {
      const $innerContent = V.cN( editable ? setEditable( {
        t: 'p',
        c: 'pxy',
        a: { title: 'preferredLangs', db: 'properties' },
        h: langs,
      } ) : {
        t: 'p',
        c: 'pxy',
        h: langs,
      } );
      return castCard( $innerContent, getString( ui.prefLang ) );
    }
    else {
      return '';
    }
  }

  function uPhraseCard() {
    const uPhrase = entity.private.uPhrase;
    if( uPhrase ) {
      const $innerContent = castUphraseNode( uPhrase );
      return castCard( $innerContent, getString( ui.uPhrase ) );
    }
    else {
      return '';
    }
  }

  function evmAddressCard() {
    const address = entity.evmCredentials ? entity.evmCredentials.address : undefined;
    if( address ) {
      // const $innerContent = V.cN( {
      //   t: 'svg',
      //   a: {
      //     viewBox: '0 0 56 18'
      //   },
      //   h: `<text x="0" y="15">${address}</text>`,
      // } );
      const $innerContent = V.cN( {
        t: 'p',
        c: 'pxy fs-s',
        h: address,
      } );

      return castCard( $innerContent, getString( ui.ethAddress ) );
    }
    else {
      return '';
    }
  }

  function evmReceiverAddressCard() {
    let address = entity.evmCredentials ? entity.evmCredentials.address : undefined;

    /**
     * Overwrite address if another receivingAddress has been defined by user
     */

    entity.receivingAddresses ? entity.receivingAddresses.evm ? address = entity.receivingAddresses.evm : undefined : undefined;

    if( address || ( !address && editable ) ) {
      const $innerContent = V.cN( editable ? setEditable( {
        t: 'p',
        c: 'pxy fs-s',
        a: { title: 'evm', db: 'receivingAddresses' },
        h: address,
      } ) : {
        t: 'p',
        c: 'pxy fs-s',
        h: address,
      } );
      return castCard( $innerContent, getString( ui.ethAddressReceiver ) );
    }
    else {
      return '';
    }
  }

  function locationCard() {
    const loc = entity.properties ? entity.properties.baseLocation || entity.properties.currentLocation : undefined;

    if( loc || ( !loc && editable ) ) {
      const $innerContent = V.cN( {
        t: 'table',
        c: 'w-full pxy',
        h: [
          {
            t: 'tr',
            h: [
              { t: 'td', c: 'capitalize', h: getString( ui.baseLoc ) },
              editable ? {
                t: 'input',
                i: 'user__loc',
                c: 'location__base pxy w-full txt-right',
                a: { value: loc },
                e: {
                  focus: handleBaseLocationFocus,
                  blur: handleBaseLocation
                }
              } : {
                t: 'p',
                c: 'location__base pxy txt-right',
                h: loc
              },
            ]
          },
          {
            t: 'tr',
            h: [
              { t: 'td', c: 'capitalize', h: getString( ui.currLoc ) },
              editable ? {
                t: 'input',
                c: 'location__curr pxy w-full txt-right',
                a: {
                  value: loc
                },
                e: {
                  focus: handleBaseLocationFocus,
                // blur: handleBaseLocation
                }
              } : {
                t: 'p',
                c: 'location__curr pxy txt-right',
                h: loc
              },
            ]
          },
          {
            t: 'tr',
            h: [
              { t: 'td', c: 'capitalize', h: getString( ui.UTCOffset ) },
              editable ? setEditable( {
                t: 'td',
                c: 'txt-right',
                a: { title: 'currentUTC', db: 'properties' },
                h: entity['properties'] ? entity['properties']['currentUTC'] : undefined
              } ) : {
                t: 'td',
                c: 'txt-right',
                h: entity['properties'] ? entity['properties']['currentUTC'] : undefined
              },
            ]
          }
        ]
      } );
      return castCard( $innerContent, getString( ui.loc ) );
    }
    else {
      return '';
    }
  }

  function entityCard() {
    const titles = ['title', 'tag', 'role'];
    const db = 'profile';
    const $innerContent = castTableNode( titles, db, false, 'capitalize' );
    return castCard( $innerContent, getString( ui.entity ) );
  }

  function financialCard() {
    const target = entity.properties ? entity.properties.target : undefined;

    if( target || ( !target && editable ) ) {
      const titles = ['target', 'unit'];
      const db = 'properties';
      const $innerContent = castTableNode( titles, db, editable );
      return castCard( $innerContent, getString( ui.fin ) );
    }
    else {
      return '';
    }
  }

  function socialCard() {
    const titles = ['facebook', 'twitter', 'telegram', 'website', 'email'];
    const db = 'social';
    const $innerContent = castTableNode( titles, db, editable );
    return $innerContent ? castCard( $innerContent, getString( ui.social ) ) : '';
  }

  function entityListCard( entity ) {
    const uPhrase = entity.private.uPhrase;
    const privateKey = entity.evmCredentials ? entity.evmCredentials.privateKey ? entity.evmCredentials.privateKey : '' : '';
    const $innerContent = V.cN( {
      t: 'div',
      h: [
        {
          t: 'h2',
          c: 'pxy font-bold fs-l',
          h: entity.fullId,
        },
        castUphraseNode( uPhrase ),
        castUphraseNode( privateKey )
      ],
    } );
    return castCard( $innerContent, '' );
  }

  function appLanguageCard() {
    const appLang = entity.properties ? entity.properties.appLang ? entity.properties.appLang : 'en_US' : 'en_US';
    if( appLang || ( !appLang && editable ) ) {
      const $innerContent = V.cN( {
        t: 'div',
        c: 'app-lang-selector',
        h: [
          {
            t: 'input',
            a: {
              type: 'radio',
              name: 'app-lang',
              value: 'en_US',
              title: 'appLang',
              db: 'properties',
              checked: appLang == 'en_US' ? true : false
            },
            k: handleRadioEntry
          },
          {
            t: 'span',
            h: '🇬🇧'
          },
          {
            t: 'input',
            a: {
              type: 'radio',
              name: 'app-lang',
              value: 'de_DE',
              title: 'appLang',
              db: 'properties',
              checked: appLang == 'de_DE' ? true : false
            },
            k: handleRadioEntry
          },
          {
            t: 'span',
            h: '🇩🇪'
          },
        ]
      } );
      return castCard( $innerContent, getString( ui.lang ) );
    }
    else {
      return '';
    }
  }

  function fundingStatusCard( sendVolume, receiveVolume ) {

    /**
     * this component has been ported from the first alpha version
     *
     */

    if ( entity.profile.role == 'pool' ) {

      const i18n = {
        strPfPg432: getString( ui.notFunded ),
        strPfPg433: getString( ui.successFunded ),
        strPfPg434: getString( ui.noneSpent ),
        strPfPg435: getString( ui.spent ),
      };

      let svgFunded = '';
      let svgSpent = '';
      let fundSuccess = i18n.strPfPg432;
      let budgetPercent = '', budgetUsed = i18n.strPfPg434;

      const funded = receiveVolume > 0 ? Math.floor( receiveVolume / entity.properties.target * 100 ) : 0;
      const spent = receiveVolume > 0 ? Math.ceil( ( sendVolume * ( 1 + V.getSetting( 'transactionFee' )/100**2 ) ) / receiveVolume * 100 ) : 0;

      if ( funded >= 0 ) {
        svgFunded = '<svg width="100" height="100" class="pool__funding-chart">\
               <circle r="25" cx="50" cy="50" class="pool__funding-pie" stroke-dasharray="' + Math.floor( 158 * ( funded / 100 ) ) + ' ' + ( 158 ) + '"/>\
             </svg>';
      }

      if ( funded > 66 ) {
        fundSuccess = '<span class="">' + i18n.strPfPg433 + '</span>';
      }

      if ( spent >= 0 ) {
        svgSpent = '<svg width="100" height="100" class="pool__spending-chart">\
      <circle r="25" cx="50" cy="50" class="pool__spending-pie" stroke-dasharray="' + Math.floor( 158 * ( spent / 100 ) ) + ' ' + ( 158 ) + '"/>\
      </svg>';
      }

      if ( spent > 0 ) {
        budgetUsed = '<span class="">' + i18n.strPfPg435 + '</span>';
        budgetPercent = '<span class="">' + spent + ' %</span>';
      }

      const $innerContent = V.cN( {
        t: 'table',
        c: 'w-full pxy',
        h: [
          {
            t: 'tr',
            h: [ { t: 'td', h: svgFunded }, { t: 'td', h: funded + ' %<br><br>' + fundSuccess } ]
          },
          {
            t: 'tr',
            h: [ { t: 'td', h: svgSpent }, { t: 'td', h: budgetPercent + '<br><br>' + budgetUsed } ]
          }
        ]
      } );

      return castCard( $innerContent, getString( ui.funding ) );
    }
    else {
      return '';
    }
  }

  function thumbnailCard() {
    if ( entity.thumbnail ) {
      const $img = V.castEntityThumbnail( entity.thumbnail ).img;
      return V.cN( {
        t: 'li',
        h: $img
      } );
      // return castCard( $img, '' );
    }
    else {
      return '';
    }
  }

  function addOrChangeImage() {
    let $innerContent;
    // const tinyImage = entity.tinyImage;
    const thumbnail = entity.thumbnail;

    if( thumbnail ) {
      const img = V.castEntityThumbnail( thumbnail ).img;
      $innerContent = V.castNode( {
        t: 'div',
        c: 'pxy',
        h: [
          {
            t: 'div',
            c: 'pxy',
            h: [
              {
                t: 'label',
                c: 'pxy',
                i: 'img-upload-profile__label',
                a: {
                  for: 'img-upload-profile__file',
                },
                h: getString( ui.chgImg )
              },
              {
                t: 'input',
                i: 'img-upload-profile__file',
                c: 'hidden',
                a: {
                  type: 'file',
                  accept: 'image/*'
                },
                e: {
                  change: handleImageUpload
                }
              }
            ]
          },
          {
            t: 'div',
            i: 'img-upload-profile__preview',
            h: img
          },
          // {
          //   t: 'p',
          //   h: 'Navigation Image Preview'
          // },
          // {
          //   t: 'div',
          //   h: V.castEntityThumbnail( tinyImage ).img
          // }
        ],
      } );
    }
    else {
      $innerContent = V.cN( {
        t: 'div',
        c: 'pxy',
        h: [
          {
            t: 'label',
            i: 'img-upload-profile__label',
            a: {
              for: 'img-upload-profile__file',
            },
            h: getString( ui.edit )
          },
          {
            t: 'input',
            i: 'img-upload-profile__file',
            c: 'hidden',
            a: {
              type: 'file',
              accept: 'image/*'
            },
            e: {
              change: handleImageUpload
            }
          },
          {
            t: 'div',
            i: 'img-upload-profile__preview',
          }
        ]
      } );
    }

    return castCard( $innerContent, getString( ui.img ) );

  }

  /* ====================== export ====================== */

  return {
    setData: setData,
    castUphraseNode: castUphraseNode,
    topcontent: topcontent,
    descriptionCard: descriptionCard,
    uPhraseCard: uPhraseCard,
    evmAddressCard: evmAddressCard,
    evmReceiverAddressCard: evmReceiverAddressCard,
    locationCard: locationCard,
    entityCard: entityCard,
    entityListCard: entityListCard,
    financialCard: financialCard,
    socialCard: socialCard,
    preferredLangsCard: preferredLangsCard,
    appLanguageCard: appLanguageCard,
    fundingStatusCard: fundingStatusCard,
    thumbnailCard: thumbnailCard,
    addOrChangeImage: addOrChangeImage
  };

} )();
